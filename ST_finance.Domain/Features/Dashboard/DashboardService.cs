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
            var resetDate = GetNextStipendResetDate(currentBkk);
            var daysRemaining = Math.Max(1, (resetDate.Date - currentBkk.Date).Days);

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

            // 5. Calculate Daily Quota
            var balanceForQuota = disposableBalance - remainingBills - remainingGoalNeeds;
            var quota = balanceForQuota / daysRemaining;
            if (quota < 0) quota = 0m; // Avoid negative quotas

            // 6. Spent Today (relative to Bangkok timezone boundaries, queried in UTC)
            var startOfTodayBkk = DateTime.SpecifyKind(
                new DateTime(currentBkk.Year, currentBkk.Month, currentBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7),
                DateTimeKind.Utc);
            var endOfTodayBkk = startOfTodayBkk.AddDays(1);

            var spentToday = await _context.TblTransactions
                .Where(t => t.UserId == userId && t.TransactionType == "Expense" && t.Date >= startOfTodayBkk && t.Date < endOfTodayBkk)
                .SumAsync(t => t.Amount);

            // 7. Chula Canteen Index
            var canteenIndex = (int)Math.Floor(Math.Max(0, quota - spentToday) / 50m);

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

            return Result.Success(new DashboardSummaryResponse(
                Quota: quota,
                CanteenIndex: canteenIndex,
                TotalBalance: totalBalance,
                TotalSavings: totalSavings,
                DisposableBalance: disposableBalance,
                MonthlyIncome: monthlyIncome,
                MonthlyExpense: monthlyExpense,
                SpentToday: spentToday,
                ActiveWarnings: warnings
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

        private static DateTime GetNextStipendResetDate(DateTime currentBkk)
        {
            var target = new DateTime(currentBkk.Year, currentBkk.Month, 25, 0, 0, 0, DateTimeKind.Utc);
            if (currentBkk >= target)
            {
                target = target.AddMonths(1);
            }
            return target;
        }
    }
}
