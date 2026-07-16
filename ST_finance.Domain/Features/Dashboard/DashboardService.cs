using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Dashboard.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<DashboardSummaryResponse>> GetDashboardSummaryAsync(Guid userId, string timeframe = "Month")
        {
            var nowUtc = DateTime.UtcNow;
            var currentBkk = nowUtc.AddHours(7);

            var profile = await _context.TblUserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            var enableQuotaPacing = profile?.EnableQuotaPacing ?? true;

            DateTime resetDate;
            int daysRemaining;
            string resetDayText = "Rolling 30 Days";

            if (enableQuotaPacing)
            {
                var primaryIncomeSchedule = await _context.TblRecurringSchedules
                    .Where(s => s.UserId == userId && s.TransactionType == "Income" && !s.DeleteFlag)
                    .OrderByDescending(s => s.Amount)
                    .FirstOrDefaultAsync();

                if (primaryIncomeSchedule != null)
                {
                    var localNextOccurrence = primaryIncomeSchedule.NextOccurrenceDate.AddHours(7);
                    resetDate = localNextOccurrence;
                    daysRemaining = Math.Max(1, (resetDate.Date - currentBkk.Date).Days);

                    var frequency = primaryIncomeSchedule.Frequency ?? "Monthly";
                    var name = primaryIncomeSchedule.Name ?? "Primary Income";

                    if (frequency == "Weekly")
                    {
                        var dayOfWeekStr = localNextOccurrence.DayOfWeek.ToString();
                        resetDayText = $"Every {dayOfWeekStr} (from {name})";
                    }
                    else if (frequency == "Monthly")
                    {
                        var daySuffix = GetDaySuffix(localNextOccurrence.Day);
                        resetDayText = $"{localNextOccurrence.Day}{daySuffix} of Month (from {name})";
                    }
                    else
                    {
                        resetDayText = $"{frequency} (from {name})";
                    }
                }
                else
                {
                    resetDate = currentBkk.AddDays(30);
                    daysRemaining = 30;
                    resetDayText = "Rolling 30 Days";
                }
            }
            else
            {
                resetDate = currentBkk.AddDays(30);
                daysRemaining = 30;
                resetDayText = "Disabled";
            }

            // 1. Total Balance
            var totalBalance = await _context.TblAccounts
                .Where(a => a.UserId == userId)
                .SumAsync(a => a.Balance ?? 0m);

            // 2. Total Savings Earmarked (exclude completed goals since they have already been spent/purchased)
            var totalSavings = await _context.TblSavingsContributions
                .Where(c => c.SavingsGoal.UserId == userId && !c.SavingsGoal.DeleteFlag && !(c.SavingsGoal.IsCompleted ?? false))
                .SumAsync(c => c.Amount);

            var disposableBalance = totalBalance - totalSavings;

            // 3. Remaining Fixed Bills (Expenses/Transfers between now and 25th in UTC)
            var resetDateUtc = DateTime.SpecifyKind(resetDate.AddHours(-7), DateTimeKind.Utc);
            var remainingBills = await _context.TblRecurringSchedules
                .Where(s => s.UserId == userId && s.TransactionType != "Income" && s.NextOccurrenceDate >= nowUtc && s.NextOccurrenceDate < resetDateUtc)
                .SumAsync(s => s.Amount);

            // 4. Remaining Savings Goal Needs
            var activeGoals = await _context.TblSavingsGoals
                .Include(g => g.TblSavingsContributions)
                .Where(g => g.UserId == userId && (g.IsCompleted == null || g.IsCompleted == false))
                .ToListAsync();

            decimal remainingGoalNeeds = 0m;
            foreach (var goal in activeGoals)
            {
                var saved = goal.TblSavingsContributions.Sum(c => c.Amount);
                var needed = goal.TargetAmount - saved;
                if (needed > 0)
                {
                    if (goal.TargetDate.HasValue && goal.TargetDate.Value > currentBkk)
                    {
                        var totalDays = (goal.TargetDate.Value.Date - currentBkk.Date).Days;
                        if (totalDays > 0)
                        {
                            var dailyShare = needed / (decimal)totalDays;
                            remainingGoalNeeds += dailyShare * daysRemaining;
                        }
                        else
                        {
                            remainingGoalNeeds += needed;
                        }
                    }
                    else
                    {
                        remainingGoalNeeds += needed;
                    }
                }
            }

            // 6. Spent Today (relative to Bangkok timezone boundaries, queried in UTC)
            var startOfTodayBkk = DateTime.SpecifyKind(
                new DateTime(currentBkk.Year, currentBkk.Month, currentBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7),
                DateTimeKind.Utc);
            var endOfTodayBkk = startOfTodayBkk.AddDays(1);

            var spentToday = await _context.TblTransactions
                .Where(t => t.UserId == userId && t.TransactionType == "Expense" && t.Date >= startOfTodayBkk && t.Date < endOfTodayBkk)
                .SumAsync(t => t.Amount);

            // 5. Calculate Daily Quota
            decimal quota = 0m;
            int canteenIndex = 0;

            if (enableQuotaPacing)
            {
                var balanceForQuota = disposableBalance - remainingBills - remainingGoalNeeds;
                quota = balanceForQuota / daysRemaining;
                if (quota < 0) quota = 0m; // Avoid negative quotas
                
                // 7. Chula Canteen Index
                canteenIndex = (int)Math.Floor(Math.Max(0, quota - spentToday) / 50m);
            }

            // 8. Income and Expenses by timeframe (relative to Bangkok timezone boundaries, queried in UTC)
            DateTime startDate = DateTime.MinValue;
            DateTime endDate = DateTime.MaxValue;

            if (string.Equals(timeframe, "Day", StringComparison.OrdinalIgnoreCase))
            {
                startDate = DateTime.SpecifyKind(new DateTime(currentBkk.Year, currentBkk.Month, currentBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                endDate = startDate.AddDays(1);
            }
            else if (string.Equals(timeframe, "Week", StringComparison.OrdinalIgnoreCase))
            {
                int diff = (7 + (currentBkk.DayOfWeek - DayOfWeek.Monday)) % 7;
                var startOfWeekBkk = currentBkk.AddDays(-1 * diff);
                startDate = DateTime.SpecifyKind(new DateTime(startOfWeekBkk.Year, startOfWeekBkk.Month, startOfWeekBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                endDate = startDate.AddDays(7);
            }
            else if (string.Equals(timeframe, "Year", StringComparison.OrdinalIgnoreCase))
            {
                startDate = DateTime.SpecifyKind(new DateTime(currentBkk.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                endDate = startDate.AddYears(1);
            }
            else // Default to Month
            {
                startDate = DateTime.SpecifyKind(new DateTime(currentBkk.Year, currentBkk.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                endDate = startDate.AddMonths(1);
            }

            var monthlyIncome = await _context.TblTransactions
                .Where(t => t.UserId == userId && t.TransactionType == "Income" && t.Date >= startDate && t.Date < endDate)
                .SumAsync(t => t.Amount);

            var monthlyExpense = await _context.TblTransactions
                .Where(t => t.UserId == userId && t.TransactionType == "Expense" && t.Date >= startDate && t.Date < endDate)
                .SumAsync(t => t.Amount);

            // 9. Warnings Setup
            var warnings = new List<string>();
            if (spentToday > quota)
            {
                warnings.Add($"You have exceeded your daily quota for today by {spentToday - quota:F2} THB!");
            }

            var startOfMonthBkk = DateTime.SpecifyKind(
                new DateTime(currentBkk.Year, currentBkk.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7),
                DateTimeKind.Utc);
            var endOfMonthBkk = startOfMonthBkk.AddMonths(1);

            var activeBudgets = await _context.TblCategoryBudgets
                .Include(b => b.Category)
                .Where(b => b.UserId == userId && b.Month == currentBkk.Month && b.Year == currentBkk.Year)
                .ToListAsync();

            foreach (var budget in activeBudgets)
            {
                var spentInCat = await _context.TblTransactions
                    .Where(t => t.UserId == userId && t.CategoryId == budget.CategoryId && t.TransactionType == "Expense" && t.Date >= startOfMonthBkk && t.Date < endOfMonthBkk)
                    .SumAsync(t => t.Amount);

                if (spentInCat > budget.LimitAmount)
                {
                    warnings.Add($"Category '{budget.Category.Name}' has exceeded its budget by {spentInCat - budget.LimitAmount:F2} THB!");
                }
            }

            if (enableQuotaPacing)
            {
                var hasIncome = await _context.TblRecurringSchedules
                    .AnyAsync(s => s.UserId == userId && s.TransactionType == "Income" && !s.DeleteFlag);
                if (!hasIncome)
                {
                    warnings.Add("Pacing-Hint: No recurring income configured. Daily quota is computed using a rolling 30-day window.");
                }
            }

            return Result.Success(new DashboardSummaryResponse(
                Quota: quota,
                CanteenIndex: canteenIndex,
                TotalBalance: totalBalance,
                TotalSavings: totalSavings,
                DisposableBalance: disposableBalance,
                MonthlyIncome: monthlyIncome,
                MonthlyExpense: monthlyExpense,
                SpentToday: spentToday,
                ActiveWarnings: warnings,
                ResetDayText: resetDayText,
                EnableQuotaPacing: enableQuotaPacing
            ));
        }

        public async Task<Result<IEnumerable<DailyQuotaLogResponse>>> GetDailyQuotaLogsAsync(Guid userId)
        {
            var logs = await _context.TblDailyQuotaLogs
                .Where(l => l.UserId == userId)
                .OrderBy(l => l.Date)
                .Take(30) // Return trends for past 30 logged days
                .ToListAsync();

            var responses = logs.Select(l => new DailyQuotaLogResponse(
                Date: l.Date,
                TargetQuota: l.TargetQuota,
                ActualSpent: l.ActualSpent
            ));

            return Result.Success(responses);
        }

        private static DateTime GetNextMonthlyResetDate(DateTime currentBkk, int dayOfMonth)
        {
            int targetDay = Math.Clamp(dayOfMonth, 1, 31);
            int daysInMonth = DateTime.DaysInMonth(currentBkk.Year, currentBkk.Month);
            if (targetDay > daysInMonth)
            {
                targetDay = daysInMonth;
            }

            var target = new DateTime(currentBkk.Year, currentBkk.Month, targetDay, 0, 0, 0, DateTimeKind.Utc);
            if (currentBkk >= target)
            {
                var nextMonth = currentBkk.AddMonths(1);
                int daysInNextMonth = DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month);
                int nextTargetDay = Math.Min(dayOfMonth, daysInNextMonth);
                target = new DateTime(nextMonth.Year, nextMonth.Month, nextTargetDay, 0, 0, 0, DateTimeKind.Utc);
            }
            return target;
        }

        private static DateTime GetNextWeeklyResetDate(DateTime currentBkk, int dayOfWeekIndex)
        {
            int targetDay = Math.Clamp(dayOfWeekIndex, 1, 7);
            DayOfWeek targetDayOfWeek = targetDay switch
            {
                1 => DayOfWeek.Monday,
                2 => DayOfWeek.Tuesday,
                3 => DayOfWeek.Wednesday,
                4 => DayOfWeek.Thursday,
                5 => DayOfWeek.Friday,
                6 => DayOfWeek.Saturday,
                7 => DayOfWeek.Sunday,
                _ => DayOfWeek.Monday
            };

            int daysToAdd = ((int)targetDayOfWeek - (int)currentBkk.DayOfWeek + 7) % 7;
            var target = new DateTime(currentBkk.Year, currentBkk.Month, currentBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(daysToAdd);
            if (currentBkk >= target)
            {
                target = target.AddDays(7);
            }
            return target;
        }

        private static string GetDaySuffix(int day)
        {
            if (day >= 11 && day <= 13) return "th";
            return (day % 10) switch
            {
                1 => "st",
                2 => "nd",
                3 => "rd",
                _ => "th"
            };
        }
    }
}
