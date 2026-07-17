using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Shared.Enums;

namespace ST_finance.Domain.Features
{
    /// <summary>
    /// Seeds the database with one realistic student user (Alex Mercer) spanning 2 years.
    /// Designed to test pagination across accounts (12), savings goals (20+), and transactions.
    /// All balances are guaranteed non-negative throughout the entire history.
    /// </summary>
    public static class DbSeeder
    {
        public static async Task SeedAsync(UserManager<TblUser> userManager, AppDbContext context)
        {
            // ── Clean up any previous seed users ─────────────────────────
            var oldUsers = new[] { "ryan", "pim", "somchai", "kanya", "alex", "emma" };
            foreach (var username in oldUsers)
            {
                var existing = await userManager.FindByNameAsync(username);
                if (existing != null)
                {
                    await DeleteUserDataAsync(context, existing.Id);
                    await userManager.DeleteAsync(existing);
                }
            }

            // ── Create single demo user: Alex Mercer ─────────────────────
            var alex = new TblUser
            {
                Id               = Guid.NewGuid(),
                UserName         = "alex",
                Email            = "alex.mercer@studentmail.com",
                FullName         = "Alex Mercer",
                EmailConfirmed   = true,
                SecurityStamp    = Guid.NewGuid().ToString(),
                DeleteFlag       = false
            };
            var createResult = await userManager.CreateAsync(alex, "Password123!");
            if (!createResult.Succeeded)
            {
                throw new Exception($"Failed to seed demo user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            }

            await SeedAlexDataAsync(context, alex.Id);
        }

        // ─────────────────────────────────────────────────────────────────
        private static async Task DeleteUserDataAsync(AppDbContext context, Guid userId)
        {
            var contributions = await context.TblSavingsContributions.IgnoreQueryFilters()
                .Where(c => c.SavingsGoal.UserId == userId).ToListAsync();
            context.TblSavingsContributions.RemoveRange(contributions);

            var goals = await context.TblSavingsGoals.IgnoreQueryFilters()
                .Where(g => g.UserId == userId).ToListAsync();
            context.TblSavingsGoals.RemoveRange(goals);

            var budgets = await context.TblCategoryBudgets.IgnoreQueryFilters()
                .Where(b => b.UserId == userId).ToListAsync();
            context.TblCategoryBudgets.RemoveRange(budgets);

            var schedules = await context.TblRecurringSchedules.IgnoreQueryFilters()
                .Where(s => s.UserId == userId).ToListAsync();
            context.TblRecurringSchedules.RemoveRange(schedules);

            var logs = await context.TblDailyQuotaLogs.IgnoreQueryFilters()
                .Where(l => l.UserId == userId).ToListAsync();
            context.TblDailyQuotaLogs.RemoveRange(logs);

            var transactions = await context.TblTransactions.IgnoreQueryFilters()
                .Where(t => t.UserId == userId).ToListAsync();
            context.TblTransactions.RemoveRange(transactions);

            var tags = await context.TblTags.IgnoreQueryFilters()
                .Where(t => t.UserId == userId).ToListAsync();
            context.TblTags.RemoveRange(tags);

            var categories = await context.TblCategories.IgnoreQueryFilters()
                .Where(c => c.UserId == userId).ToListAsync();
            context.TblCategories.RemoveRange(categories);

            var accounts = await context.TblAccounts.IgnoreQueryFilters()
                .Where(a => a.UserId == userId).ToListAsync();
            context.TblAccounts.RemoveRange(accounts);

            var profiles = await context.TblUserProfiles.IgnoreQueryFilters()
                .Where(p => p.UserId == userId).ToListAsync();
            context.TblUserProfiles.RemoveRange(profiles);

            await context.SaveChangesAsync();
        }

        // ─────────────────────────────────────────────────────────────────
        private static async Task SeedAlexDataAsync(AppDbContext context, Guid userId)
        {
            var now = DateTime.UtcNow;
            var rnd = new Random(77); // Fixed seed → reproducible

            // ── User Profile ─────────────────────────────────────────────
            context.TblUserProfiles.Add(new TblUserProfile
            {
                Id                    = Guid.NewGuid(),
                UserId                = userId,
                MonthlyAllowanceAmount = 20000m,
                AllowanceDayOfMonth   = 25,
                TargetMonthlySavings  = 4000m,
                Currency              = "THB",
                UpdatedAt             = now
            });

            // ── 12 Accounts ─────────────────────────────────────────────
            // Starting balances are deliberately high so 2 years of expenses never go negative.
            var acMain    = MakeAccount(userId, "Main Checking",        AccountType.Bank,        120_000m, "#3b82f6", "Wallet",      now.AddMonths(-24));
            var acSavBank = MakeAccount(userId, "Savings Account",      AccountType.Bank,         80_000m, "#0ea5e9", "PiggyBank",   now.AddMonths(-24));
            var acWallet  = MakeAccount(userId, "Pay Wallet",           AccountType.EWallet,       8_000m, "#ef4444", "Smartphone",  now.AddMonths(-24));
            var acGPay    = MakeAccount(userId, "GPay",                 AccountType.EWallet,       5_000m, "#f97316", "Nfc",         now.AddMonths(-22));
            var acShop    = MakeAccount(userId, "Shopping E-Wallet",    AccountType.EWallet,       6_000m, "#ec4899", "ShoppingBag", now.AddMonths(-20));
            var acTransit = MakeAccount(userId, "Metro Transit Card",   AccountType.TransitCard,   3_000m, "#10b981", "Train",       now.AddMonths(-24));
            var acBus     = MakeAccount(userId, "City Bus Card",        AccountType.TransitCard,   1_500m, "#14b8a6", "Bus",         now.AddMonths(-18));
            var acCash    = MakeAccount(userId, "Cash on Hand",         AccountType.Cash,          5_000m, "#f59e0b", "Coins",       now.AddMonths(-24));
            var acCash2   = MakeAccount(userId, "Emergency Cash",       AccountType.Cash,         10_000m, "#84cc16", "Banknote",    now.AddMonths(-20));
            var acStudLoan= MakeAccount(userId, "Student Loan Buffer",  AccountType.Bank,         50_000m, "#8b5cf6", "GraduationCap", now.AddMonths(-24));
            var acFreelance= MakeAccount(userId, "Freelance Account",   AccountType.Bank,         15_000m, "#d946ef", "Briefcase",   now.AddMonths(-16));
            var acInvest  = MakeAccount(userId, "Investment Savings",   AccountType.Bank,         25_000m, "#a78bfa", "TrendingUp",  now.AddMonths(-12));

            var accounts = new[] { acMain, acSavBank, acWallet, acGPay, acShop, acTransit, acBus, acCash, acCash2, acStudLoan, acFreelance, acInvest };
            context.TblAccounts.AddRange(accounts);

            // ── Categories ───────────────────────────────────────────────
            var catFood    = MakeCat(userId, "Food & Drinks",    "Expense", "Utensils",    "#ef4444");
            var catRent    = MakeCat(userId, "Rent & Utilities", "Expense", "Home",        "#3b82f6");
            var catTransit = MakeCat(userId, "Transit",          "Expense", "Train",       "#10b981");
            var catEdu     = MakeCat(userId, "Education",        "Expense", "BookOpen",    "#8b5cf6");
            var catShop    = MakeCat(userId, "Shopping",         "Expense", "ShoppingBag", "#ec4899");
            var catEntertain = MakeCat(userId, "Entertainment",  "Expense", "Film",        "#f97316");
            var catHealth  = MakeCat(userId, "Health",           "Expense", "HeartPulse",  "#f43f5e");
            var catIncome  = MakeCat(userId, "Scholarship",      "Income",  "Award",       "#22c55e");
            var catFreelance= MakeCat(userId, "Freelance Income","Income",  "Briefcase",   "#a855f7");
            context.TblCategories.AddRange(catFood, catRent, catTransit, catEdu, catShop, catEntertain, catHealth, catIncome, catFreelance);

            // ── Tags ─────────────────────────────────────────────────────
            var tagCafe     = MakeTag(userId, "Cafe",          "#f59e0b");
            var tagGrocery  = MakeTag(userId, "Grocery",       "#84cc16");
            var tagTransit  = MakeTag(userId, "Transit",       "#10b981");
            var tagSub      = MakeTag(userId, "Subscription",  "#3b82f6");
            var tagUni      = MakeTag(userId, "University",    "#8b5cf6");
            var tagMedical  = MakeTag(userId, "Medical",       "#f43f5e");
            context.TblTags.AddRange(tagCafe, tagGrocery, tagTransit, tagSub, tagUni, tagMedical);

            // ── Savings Goals ─────────────────────────────────────────────
            // 15 COMPLETED goals (various durations ago) + 6 ACTIVE goals
            var completedGoals = new (string Name, decimal Target, int StartMonthsAgo, int CompletedMonthsAgo)[]
            {
                ("Semester 1 Textbooks",     5_000m,  24, 15),
                ("New Headphones",           3_500m,  22, 19),
                ("Semester 2 Textbooks",     5_500m,  20,  8),
                ("Birthday Trip",           12_000m,  20, 17),
                ("Graphic Tablet",           8_000m,  18, 14),
                ("Dorm Room Upgrade",        6_500m,  17,  5),
                ("Semester 3 Textbooks",     5_000m,  16, 13),
                ("Gaming Keyboard",          2_800m,  15,  3),
                ("Gym Membership 1 Year",    5_400m,  14, 11),
                ("Summer Internship Fund",  15_000m,  14,  6),
                ("Mechanical Watch",         9_800m,  13,  9),
                ("New Sneakers",             4_200m,  11,  8),
                ("Semester 4 Textbooks",     5_000m,  10,  7),
                ("Camera Lens",             18_000m,  10,  2),
                ("Conference Registration",  7_500m,   7,  4),
            };

            var activeGoals = new (string Name, decimal Target, int StartMonthsAgo, int? TargetMonthsAhead)[]
            {
                ("New Laptop",              35_000m,  22, 4),
                ("Emergency Fund 6 Months", 60_000m,  18, null),
                ("Summer Study Abroad",     45_000m,  12, 8),
                ("Graduation Gift to Self", 20_000m,   8, 10),
                ("Investment Seed Capital", 50_000m,   6, null),
                ("Research Conference",     10_000m,   3, 3),
            };

            // Create completed goal entities + contributions
            var goalContributions = new List<TblSavingsContribution>();

            foreach (var (Name, Target, StartMonthsAgo, CompletedMonthsAgo) in completedGoals)
            {
                var created     = now.AddMonths(-StartMonthsAgo);
                var completedAt = now.AddMonths(-CompletedMonthsAgo)
                                     .AddDays(rnd.Next(-10, 0));   // completed a few days before month cutoff
                var targetDate  = created.AddMonths(StartMonthsAgo / 2 + rnd.Next(1, 4));

                var goal = new TblSavingsGoal
                {
                    Id          = Guid.NewGuid(),
                    UserId      = userId,
                    GoalName    = Name,
                    TargetAmount= Target,
                    TargetDate  = targetDate,
                    IsCompleted = true,
                    CompletedAt = completedAt,
                    CreatedAt   = created,
                    DeleteFlag  = false
                };
                context.TblSavingsGoals.Add(goal);

                // Distribute contributions evenly over the lifetime
                var lifetimeMonths = StartMonthsAgo - CompletedMonthsAgo;
                if (lifetimeMonths < 1) lifetimeMonths = 1;
                var perMonth = Math.Round(Target / lifetimeMonths, 2);

                for (int cm = 0; cm < lifetimeMonths; cm++)
                {
                    var contribDate = created.AddMonths(cm).AddDays(rnd.Next(1, 5));
                    goalContributions.Add(new TblSavingsContribution
                    {
                        Id           = Guid.NewGuid(),
                        SavingsGoalId= goal.Id,
                        Amount       = perMonth,
                        Date         = contribDate,
                        Note         = "Regular saving contribution"
                    });
                }
            }

            // Create active goal entities + partial contributions
            var activeGoalRunningTotals = new Dictionary<Guid, decimal>();
            foreach (var (Name, Target, StartMonthsAgo, TargetMonthsAhead) in activeGoals)
            {
                var created    = now.AddMonths(-StartMonthsAgo);
                var targetDate = TargetMonthsAhead.HasValue ? (DateTime?)now.AddMonths(TargetMonthsAhead.Value) : null;

                // Save roughly 40-70% of target as "current amount"
                var savedFraction = 0.40m + (decimal)rnd.Next(0, 30) / 100m;
                var totalSaved    = Math.Round(Target * savedFraction, 2);

                var goal = new TblSavingsGoal
                {
                    Id          = Guid.NewGuid(),
                    UserId      = userId,
                    GoalName    = Name,
                    TargetAmount= Target,
                    TargetDate  = targetDate,
                    IsCompleted = false,
                    CompletedAt = null,
                    CreatedAt   = created,
                    DeleteFlag  = false
                };
                context.TblSavingsGoals.Add(goal);
                activeGoalRunningTotals[goal.Id] = totalSaved;

                // Spread contributions monthly
                var lifetimeMonths = StartMonthsAgo;
                if (lifetimeMonths < 1) lifetimeMonths = 1;
                var perMonth = Math.Round(totalSaved / lifetimeMonths, 2);

                for (int cm = 0; cm < lifetimeMonths; cm++)
                {
                    var contribDate = created.AddMonths(cm).AddDays(rnd.Next(1, 5));
                    if (contribDate > now) break;
                    goalContributions.Add(new TblSavingsContribution
                    {
                        Id            = Guid.NewGuid(),
                        SavingsGoalId = goal.Id,
                        Amount        = perMonth,
                        Date          = contribDate,
                        Note          = "Monthly savings allocation"
                    });
                }
            }

            context.TblSavingsContributions.AddRange(goalContributions);

            // ── 2-Year Transaction History ────────────────────────────────
            // Strategy: track running balances per account to prevent negatives.
            // Income arrives first each month, expenses follow.
            var balances = accounts.ToDictionary(a => a.Id, a => a.Balance ?? 0m);
            var transactions = new List<TblTransaction>();

            // Helper to add expense (only if balance allows, else skip/reduce)
            TblTransaction? TryAddExpense(Guid accId, Guid catId, decimal amount, DateTime date, string desc, TblTag? tag = null)
            {
                if (balances[accId] < amount) return null; // guard: would go negative
                balances[accId] -= amount;
                var tx = new TblTransaction
                {
                    Id              = Guid.NewGuid(),
                    UserId          = userId,
                    AccountId       = accId,
                    CategoryId      = catId,
                    Amount          = amount,
                    TransactionType = "Expense",
                    Date            = date,
                    Description     = desc,
                    CreatedAt       = date,
                    DeleteFlag      = false
                };
                if (tag != null) tx.Tags.Add(tag);
                return tx;
            }

            void AddIncome(Guid accId, Guid catId, decimal amount, DateTime date, string desc)
            {
                balances[accId] += amount;
                transactions.Add(new TblTransaction
                {
                    Id              = Guid.NewGuid(),
                    UserId          = userId,
                    AccountId       = accId,
                    CategoryId      = catId,
                    Amount          = amount,
                    TransactionType = "Income",
                    Date            = date,
                    Description     = desc,
                    CreatedAt       = date,
                    DeleteFlag      = false
                });
            }

            void AddTransfer(Guid fromId, Guid toId, decimal amount, DateTime date, string desc)
            {
                if (balances[fromId] < amount) return; // guard
                balances[fromId] -= amount;
                balances[toId]   += amount;
                transactions.Add(new TblTransaction
                {
                    Id              = Guid.NewGuid(),
                    UserId          = userId,
                    AccountId       = fromId,
                    TargetAccountId = toId,
                    Amount          = amount,
                    TransactionType = "Transfer",
                    Date            = date,
                    Description     = desc,
                    CreatedAt       = date,
                    DeleteFlag      = false
                });
            }

            for (int m = -23; m <= 0; m++)
            {
                var monthBase = now.AddMonths(m);
                var y = monthBase.Year;
                var mo = monthBase.Month;
                var daysInMonth = DateTime.DaysInMonth(y, mo);
                var monthStart = new DateTime(y, mo, 1, 0, 0, 0, DateTimeKind.Utc);

                // ── Income flows (first few days of month, before expenses) ──

                // Scholarship stipend on the 25th of prior month → credited 1st
                var stipend = 20_000m;
                AddIncome(acMain.Id, catIncome.Id, stipend, monthStart.AddHours(8), "Monthly Scholarship Stipend");

                // Freelance income (Alex does part-time web gigs from month -16 onwards)
                if (m >= -16 && m % 2 == 0) // bi-monthly freelance
                {
                    var freelanceAmt = 5_000m + rnd.Next(0, 8000);
                    AddIncome(acFreelance.Id, catFreelance.Id, (decimal)freelanceAmt, monthStart.AddDays(3).AddHours(14), "Web Development Project Payment");
                }

                // Investment savings deposit (from month -12 onwards, on 5th)
                if (m >= -12)
                {
                    AddTransfer(acMain.Id, acInvest.Id, 3_000m, monthStart.AddDays(4).AddHours(10), "Monthly Investment Contribution");
                }

                // ── Monthly Fixed Expenses ────────────────────────────────

                // Rent / utilities
                var rentTx = TryAddExpense(acMain.Id, catRent.Id, 6_500m,
                    monthStart.AddDays(1).AddHours(9), "Monthly Dorm Rent & Utilities");
                if (rentTx != null) transactions.Add(rentTx);

                // Phone plan
                var phoneTx = TryAddExpense(acMain.Id, catRent.Id, 399m,
                    monthStart.AddDays(2).AddHours(10), "Mobile Data Plan");
                if (phoneTx != null) { phoneTx.Tags.Add(tagSub); transactions.Add(phoneTx); }

                // Streaming subscription (wallet)
                var streamTx = TryAddExpense(acWallet.Id, catEntertain.Id, 149m,
                    monthStart.AddDays(2).AddHours(11), "Streaming Service Subscription");
                if (streamTx != null) { streamTx.Tags.Add(tagSub); transactions.Add(streamTx); }

                // University tuition every 6 months (Semester fee)
                if (mo == 1 || mo == 7)
                {
                    var tuitionTx = TryAddExpense(acStudLoan.Id, catEdu.Id, 18_000m,
                        monthStart.AddDays(5).AddHours(9), "Semester Tuition Fee");
                    if (tuitionTx != null) { tuitionTx.Tags.Add(tagUni); transactions.Add(tuitionTx); }
                }

                // ── Monthly Topups / Transfers ────────────────────────────
                // Transit card refill
                AddTransfer(acMain.Id, acTransit.Id, 1_200m, monthStart.AddDays(1).AddHours(7), "Metro Card Monthly Refill");

                // Bus card refill (from month -18)
                if (m >= -18)
                {
                    AddTransfer(acMain.Id, acBus.Id, 600m, monthStart.AddDays(1).AddHours(7).AddMinutes(30), "City Bus Card Refill");
                }

                // Wallet topup
                AddTransfer(acMain.Id, acWallet.Id, 3_000m, monthStart.AddDays(1).AddHours(8), "Pay Wallet Monthly Topup");

                // GPay topup (from month -22)
                if (m >= -22)
                {
                    AddTransfer(acMain.Id, acGPay.Id, 1_500m, monthStart.AddDays(1).AddHours(8).AddMinutes(30), "GPay Monthly Topup");
                }

                // Shopping wallet topup (from month -20)
                if (m >= -20)
                {
                    AddTransfer(acMain.Id, acShop.Id, 2_000m, monthStart.AddDays(1).AddHours(9), "Shopping Wallet Topup");
                }

                // Cash withdrawal (ATM)
                AddTransfer(acMain.Id, acCash.Id, 2_500m, monthStart.AddDays(1).AddHours(10), "ATM Cash Withdrawal");

                // Savings bank transfer on payday
                AddTransfer(acMain.Id, acSavBank.Id, 4_000m, monthStart.AddDays(1).AddHours(11), "Monthly Savings Transfer");

                // ── Daily Variable Expenses ───────────────────────────────
                for (int d = 1; d <= daysInMonth; d++)
                {
                    var dayUtc = new DateTime(y, mo, d, 12, 0, 0, DateTimeKind.Utc);
                    if (dayUtc > now) break;

                    // Breakfast (cash or wallet, alternating)
                    var breakfastCost = (decimal)rnd.Next(50, 90);
                    var breakfastAcc  = d % 3 == 0 ? acGPay.Id : (d % 2 == 0 ? acWallet.Id : acCash.Id);
                    var bfTx = TryAddExpense(breakfastAcc, catFood.Id, breakfastCost,
                        dayUtc.AddHours(-4), "Breakfast");
                    if (bfTx != null) { bfTx.Tags.Add(tagCafe); transactions.Add(bfTx); }

                    // Lunch (campus cafeteria or nearby restaurant)
                    var lunchCost = (decimal)rnd.Next(80, 150);
                    var lunchAcc  = d % 2 == 0 ? acCash.Id : acWallet.Id;
                    var lunchTx = TryAddExpense(lunchAcc, catFood.Id, lunchCost,
                        dayUtc, "Lunch at Campus Cafeteria");
                    if (lunchTx != null) transactions.Add(lunchTx);

                    // Dinner (most days)
                    if (d % 7 != 0) // skip one day a week (ate at home for free)
                    {
                        var dinnerCost = (decimal)rnd.Next(100, 200);
                        var dinnerAcc  = d % 3 == 0 ? acCash.Id : acGPay.Id;
                        var dinnerTx = TryAddExpense(dinnerAcc, catFood.Id, dinnerCost,
                            dayUtc.AddHours(6), "Dinner");
                        if (dinnerTx != null) transactions.Add(dinnerTx);
                    }

                    // Coffee / snack (every other day)
                    if (d % 2 == 1)
                    {
                        var coffeeCost = (decimal)rnd.Next(60, 100);
                        var coffeeTx = TryAddExpense(acWallet.Id, catFood.Id, coffeeCost,
                            dayUtc.AddHours(-2), "Coffee & Snack");
                        if (coffeeTx != null) { coffeeTx.Tags.Add(tagCafe); transactions.Add(coffeeTx); }
                    }

                    // Metro transit (weekdays)
                    var dayOfWeek = dayUtc.DayOfWeek;
                    if (dayOfWeek != DayOfWeek.Saturday && dayOfWeek != DayOfWeek.Sunday)
                    {
                        var metroAmt = (decimal)rnd.Next(44, 70);
                        var metroTx = TryAddExpense(acTransit.Id, catTransit.Id, metroAmt,
                            dayUtc.AddHours(-4).AddMinutes(30), "Metro Commute");
                        if (metroTx != null) { metroTx.Tags.Add(tagTransit); transactions.Add(metroTx); }

                        // Bus on some weekdays
                        if (d % 3 == 0 && m >= -18)
                        {
                            var busTx = TryAddExpense(acBus.Id, catTransit.Id, (decimal)rnd.Next(20, 35),
                                dayUtc.AddHours(-3), "Bus to Uni");
                            if (busTx != null) { busTx.Tags.Add(tagTransit); transactions.Add(busTx); }
                        }
                    }

                    // Weekend entertainment (Fridays or Saturdays)
                    if (dayOfWeek == DayOfWeek.Friday || dayOfWeek == DayOfWeek.Saturday)
                    {
                        var entCost = (decimal)rnd.Next(150, 500);
                        var entAcc  = dayOfWeek == DayOfWeek.Friday ? acWallet.Id : acShop.Id;
                        var entTx = TryAddExpense(entAcc, catEntertain.Id, entCost,
                            dayUtc.AddHours(5), "Weekend Entertainment");
                        if (entTx != null) transactions.Add(entTx);
                    }

                    // Monthly grocery run (every ~7 days)
                    if (d % 7 == 3)
                    {
                        var groceryCost = (decimal)rnd.Next(600, 1200);
                        var groceryTx = TryAddExpense(acShop.Id, catShop.Id, groceryCost,
                            dayUtc.AddHours(3), "Grocery Run");
                        if (groceryTx != null) { groceryTx.Tags.Add(tagGrocery); transactions.Add(groceryTx); }
                    }

                    // Occasional health expense (~once a month)
                    if (d == 12)
                    {
                        var healthCost = (decimal)rnd.Next(200, 800);
                        var healthTx = TryAddExpense(acCash2.Id, catHealth.Id, healthCost,
                            dayUtc.AddHours(2), "Pharmacy / Clinic Visit");
                        if (healthTx != null) { healthTx.Tags.Add(tagMedical); transactions.Add(healthTx); }
                    }

                    // University supplies (twice a semester)
                    if ((d == 8 || d == 20) && (mo == 1 || mo == 2 || mo == 7 || mo == 8))
                    {
                        var supTx = TryAddExpense(acSavBank.Id, catEdu.Id, (decimal)rnd.Next(800, 2500),
                            dayUtc.AddHours(1), "University Supplies & Materials");
                        if (supTx != null) { supTx.Tags.Add(tagUni); transactions.Add(supTx); }
                    }
                }

                // ── Monthly Category Budgets ──────────────────────────────
                context.TblCategoryBudgets.AddRange(
                    MakeBudget(userId, catFood.Id,      8_000m, mo, y, monthBase),
                    MakeBudget(userId, catRent.Id,      7_000m, mo, y, monthBase),
                    MakeBudget(userId, catTransit.Id,   2_000m, mo, y, monthBase),
                    MakeBudget(userId, catShop.Id,      3_000m, mo, y, monthBase),
                    MakeBudget(userId, catEntertain.Id, 2_500m, mo, y, monthBase),
                    MakeBudget(userId, catHealth.Id,    1_000m, mo, y, monthBase)
                );
            }

            context.TblTransactions.AddRange(transactions);

            // ── Recurring Schedules ───────────────────────────────────────
            context.TblRecurringSchedules.AddRange(
                MakeSchedule(userId, acMain.Id,    "Monthly Scholarship Stipend",  20_000m, "Income",   "Monthly", now, 25),
                MakeSchedule(userId, acMain.Id,    "Monthly Dorm Rent & Utilities",  6_500m, "Expense",  "Monthly", now, 1),
                MakeSchedule(userId, acMain.Id,    "Mobile Data Plan",               399m, "Expense",   "Monthly", now, 2),
                MakeSchedule(userId, acMain.Id,    "Savings Transfer",             4_000m, "Transfer",  "Monthly", now, 1),
                MakeSchedule(userId, acStudLoan.Id,"Tuition Fee (Biannual)",      18_000m, "Expense",   "BiAnnual", now, 1),
                MakeSchedule(userId, acFreelance.Id,"Web Dev Freelance Retainer",  6_500m, "Income",    "BiMonthly", now, 3)
            );

            // ── 60-Day Daily Quota Logs (past 60 days, ending yesterday) ─
            var quotaLogs = new List<TblDailyQuotaLog>();
            for (int d = -60; d < 0; d++)
            {
                var logDate = now.AddDays(d);
                var dateStart = DateTime.SpecifyKind(logDate.Date, DateTimeKind.Utc);
                var dateEnd   = dateStart.AddDays(1);

                var actualSpent = transactions
                    .Where(t => t.TransactionType == "Expense"
                             && t.Date >= dateStart
                             && t.Date < dateEnd)
                    .Sum(t => t.Amount);

                if (actualSpent == 0m)
                    actualSpent = (decimal)rnd.Next(200, 650);

                quotaLogs.Add(new TblDailyQuotaLog
                {
                    Id          = Guid.NewGuid(),
                    UserId      = userId,
                    Date        = DateOnly.FromDateTime(logDate),
                    TargetQuota = Math.Round(700m + (decimal)rnd.Next(-150, 150), 2),
                    ActualSpent = Math.Round(actualSpent, 2),
                    CreatedAt   = logDate
                });
            }
            context.TblDailyQuotaLogs.AddRange(quotaLogs);

            // ── Sync in-memory balance back to account entities ───────────
            foreach (var acc in accounts)
            {
                acc.Balance = Math.Max(0m, balances[acc.Id]); // clamp to 0 as absolute safety net
            }

            await context.SaveChangesAsync();
        }

        // ── Factory helpers ───────────────────────────────────────────────
        private static TblAccount MakeAccount(Guid userId, string name, AccountType type, decimal startBalance, string color, string icon, DateTime created) =>
            new TblAccount
            {
                Id          = Guid.NewGuid(),
                UserId      = userId,
                Name        = name,
                AccountType = type,
                Balance     = startBalance,
                Color       = color,
                Icon        = icon,
                CreatedAt   = created,
                DeleteFlag  = false
            };

        private static TblCategory MakeCat(Guid userId, string name, string type, string icon, string color) =>
            new TblCategory
            {
                Id         = Guid.NewGuid(),
                UserId     = userId,
                Name       = name,
                Type       = type,
                Icon       = icon,
                Color      = color,
                DeleteFlag = false
            };

        private static TblTag MakeTag(Guid userId, string name, string color) =>
            new TblTag
            {
                Id         = Guid.NewGuid(),
                UserId     = userId,
                Name       = name,
                Color      = color,
                DeleteFlag = false
            };

        private static TblCategoryBudget MakeBudget(Guid userId, Guid catId, decimal limit, int month, int year, DateTime created) =>
            new TblCategoryBudget
            {
                Id          = Guid.NewGuid(),
                UserId      = userId,
                CategoryId  = catId,
                LimitAmount = limit,
                Month       = month,
                Year        = year,
                CreatedAt   = created,
                DeleteFlag  = false
            };

        private static TblRecurringSchedule MakeSchedule(Guid userId, Guid accId, string name, decimal amount, string txType, string freq, DateTime now, int dayOfMonth) =>
            new TblRecurringSchedule
            {
                Id                  = Guid.NewGuid(),
                UserId              = userId,
                AccountId           = accId,
                Name                = name,
                Amount              = amount,
                TransactionType     = txType,
                Frequency           = freq,
                StartDate           = now.AddMonths(-24),
                NextOccurrenceDate  = new DateTime(now.Year, now.Month, dayOfMonth, 0, 0, 0, DateTimeKind.Utc).AddMonths(1),
                DeleteFlag          = false
            };
    }
}
