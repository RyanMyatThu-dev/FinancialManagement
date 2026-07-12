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
    public static class DbSeeder
    {
        public static async Task SeedAsync(UserManager<TblUser> userManager, AppDbContext context)
        {
            // 1. Clean up existing test users if they exist
            var existingUser1 = await userManager.FindByNameAsync("ryan");
            if (existingUser1 != null)
            {
                await DeleteUserDataAsync(context, existingUser1.Id);
                await userManager.DeleteAsync(existingUser1);
            }

            var existingUser2 = await userManager.FindByNameAsync("pim");
            if (existingUser2 != null)
            {
                await DeleteUserDataAsync(context, existingUser2.Id);
                await userManager.DeleteAsync(existingUser2);
            }

            // 2. Create User 1: Ryan (Scholarship Student)
            var ryan = new TblUser
            {
                Id = Guid.NewGuid(),
                UserName = "ryan",
                Email = "ryan@chula.ac.th",
                FullName = "Ryan Myat Thu",
                EmailConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString(),
                DeleteFlag = false
            };
            var result1 = await userManager.CreateAsync(ryan, "Password123!");
            if (!result1.Succeeded)
            {
                throw new Exception($"Failed to seed Ryan user: {string.Join(", ", result1.Errors.Select(e => e.Description))}");
            }

            // 3. Create User 2: Pim (Standard Student)
            var pim = new TblUser
            {
                Id = Guid.NewGuid(),
                UserName = "pim",
                Email = "pim@chula.ac.th",
                FullName = "Pim Chula",
                EmailConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString(),
                DeleteFlag = false
            };
            var result2 = await userManager.CreateAsync(pim, "Password123!");
            if (!result2.Succeeded)
            {
                throw new Exception($"Failed to seed Pim user: {string.Join(", ", result2.Errors.Select(e => e.Description))}");
            }

            // 4. Seed user specific data
            await SeedRyanDataAsync(context, ryan.Id);
            await SeedPimDataAsync(context, pim.Id);
        }

        private static async Task DeleteUserDataAsync(AppDbContext context, Guid userId)
        {
            // Bypass query filters to ensure everything is deleted
            var contributions = await context.TblSavingsContributions.IgnoreQueryFilters().Where(c => c.SavingsGoal.UserId == userId).ToListAsync();
            context.TblSavingsContributions.RemoveRange(contributions);

            var goals = await context.TblSavingsGoals.IgnoreQueryFilters().Where(g => g.UserId == userId).ToListAsync();
            context.TblSavingsGoals.RemoveRange(goals);

            var budgets = await context.TblCategoryBudgets.IgnoreQueryFilters().Where(b => b.UserId == userId).ToListAsync();
            context.TblCategoryBudgets.RemoveRange(budgets);

            var schedules = await context.TblRecurringSchedules.IgnoreQueryFilters().Where(s => s.UserId == userId).ToListAsync();
            context.TblRecurringSchedules.RemoveRange(schedules);

            var logs = await context.TblDailyQuotaLogs.IgnoreQueryFilters().Where(l => l.UserId == userId).ToListAsync();
            context.TblDailyQuotaLogs.RemoveRange(logs);

            var transactions = await context.TblTransactions.IgnoreQueryFilters().Where(t => t.UserId == userId).ToListAsync();
            context.TblTransactions.RemoveRange(transactions);

            var tags = await context.TblTags.IgnoreQueryFilters().Where(t => t.UserId == userId).ToListAsync();
            context.TblTags.RemoveRange(tags);

            var categories = await context.TblCategories.IgnoreQueryFilters().Where(c => c.UserId == userId).ToListAsync();
            context.TblCategories.RemoveRange(categories);

            var accounts = await context.TblAccounts.IgnoreQueryFilters().Where(a => a.UserId == userId).ToListAsync();
            context.TblAccounts.RemoveRange(accounts);

            var profiles = await context.TblUserProfiles.IgnoreQueryFilters().Where(p => p.UserId == userId).ToListAsync();
            context.TblUserProfiles.RemoveRange(profiles);

            await context.SaveChangesAsync();
        }

        private static async Task SeedRyanDataAsync(AppDbContext context, Guid userId)
        {
            var now = DateTime.UtcNow;

            // Profile settings
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MonthlyAllowanceAmount = 16000.00m,
                AllowanceDayOfMonth = 25,
                TargetMonthlySavings = 2000.00m,
                Currency = "THB",
                UpdatedAt = now
            };
            context.TblUserProfiles.Add(profile);

            // Accounts
            var scb = new TblAccount { Id = Guid.NewGuid(), UserId = userId, Name = "SCB Bank", AccountType = AccountType.Bank, Balance = 24500.00m, Color = "#3b82f6", Icon = "Wallet", CreatedAt = now, DeleteFlag = false };
            var wallet = new TblAccount { Id = Guid.NewGuid(), UserId = userId, Name = "TrueMoney Wallet", AccountType = AccountType.EWallet, Balance = 3200.00m, Color = "#ef4444", Icon = "Smartphone", CreatedAt = now, DeleteFlag = false };
            var rabbit = new TblAccount { Id = Guid.NewGuid(), UserId = userId, Name = "Rabbit Card", AccountType = AccountType.TransitCard, Balance = 800.00m, Color = "#f59e0b", Icon = "CreditCard", CreatedAt = now, DeleteFlag = false };
            var cash = new TblAccount { Id = Guid.NewGuid(), UserId = userId, Name = "Cash Pocket", AccountType = AccountType.Cash, Balance = 1500.00m, Color = "#10b981", Icon = "Coins", CreatedAt = now, DeleteFlag = false };
            context.TblAccounts.AddRange(scb, wallet, rabbit, cash);

            // Categories
            var catFood = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Food & Drinks", Type = "Expense", Icon = "Utensils", Color = "#ef4444", DeleteFlag = false };
            var catRent = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Rent & Bills", Type = "Expense", Icon = "Home", Color = "#3b82f6", DeleteFlag = false };
            var catTransit = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Transit", Type = "Expense", Icon = "Train", Color = "#10b981", DeleteFlag = false };
            var catEducation = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Education", Type = "Expense", Icon = "BookOpen", Color = "#8b5cf6", DeleteFlag = false };
            var catShopping = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Shopping", Type = "Expense", Icon = "ShoppingBag", Color = "#ec4899", DeleteFlag = false };
            var catStipend = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Stipend", Type = "Income", Icon = "Award", Color = "#df1a83", DeleteFlag = false };
            context.TblCategories.AddRange(catFood, catRent, catTransit, catEducation, catShopping, catStipend);

            // Tags
            var tagCanteen = new TblTag { Id = Guid.NewGuid(), UserId = userId, Name = "Canteen", Color = "#ef4444", DeleteFlag = false };
            var tagBts = new TblTag { Id = Guid.NewGuid(), UserId = userId, Name = "BTS", Color = "#10b981", DeleteFlag = false };
            var tagSub = new TblTag { Id = Guid.NewGuid(), UserId = userId, Name = "Subscription", Color = "#3b82f6", DeleteFlag = false };
            var tagUni = new TblTag { Id = Guid.NewGuid(), UserId = userId, Name = "University", Color = "#df1a83", DeleteFlag = false };
            context.TblTags.AddRange(tagCanteen, tagBts, tagSub, tagUni);

            // Savings Goals
            var ipadGoal = new TblSavingsGoal
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                GoalName = "M4 iPad Pro",
                TargetAmount = 32000.00m,
                TargetDate = now.AddMonths(6),
                IsCompleted = false,
                CreatedAt = now.AddMonths(-10),
                DeleteFlag = false
            };
            context.TblSavingsGoals.Add(ipadGoal);

            // Seed 1 year of historical transactions (past 12 months)
            var rnd = new Random(42); // Seed for reproducible transactions
            var transactions = new List<TblTransaction>();
            var contributions = new List<TblSavingsContribution>();

            for (int m = -11; m <= 0; m++)
            {
                var monthDate = now.AddMonths(m);
                var daysInMonth = DateTime.DaysInMonth(monthDate.Year, monthDate.Month);

                // 1. Stipend Income on the 25th
                var stipendDate = new DateTime(monthDate.Year, monthDate.Month, 25, 10, 0, 0, DateTimeKind.Utc);
                if (stipendDate <= now)
                {
                    transactions.Add(new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = scb.Id,
                        CategoryId = catStipend.Id,
                        Amount = 16000.00m,
                        TransactionType = "Income",
                        Date = stipendDate,
                        Description = "Monthly Scholarship Stipend",
                        CreatedAt = stipendDate,
                        DeleteFlag = false
                    });
                }

                // 2. Rent on the 1st
                var rentDate = new DateTime(monthDate.Year, monthDate.Month, 1, 9, 0, 0, DateTimeKind.Utc);
                if (rentDate <= now)
                {
                    transactions.Add(new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = scb.Id,
                        CategoryId = catRent.Id,
                        Amount = 5000.00m,
                        TransactionType = "Expense",
                        Date = rentDate,
                        Description = "Monthly Room Rent",
                        CreatedAt = rentDate,
                        DeleteFlag = false
                    });
                }

                // 3. BTS Card Topup on the 1st
                var btsDate = new DateTime(monthDate.Year, monthDate.Month, 1, 8, 30, 0, DateTimeKind.Utc);
                if (btsDate <= now)
                {
                    var txBts = new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = scb.Id,
                        CategoryId = catTransit.Id,
                        Amount = 800.00m,
                        TransactionType = "Expense",
                        Date = btsDate,
                        Description = "BTS Transit Pass Refill",
                        CreatedAt = btsDate,
                        DeleteFlag = false
                    };
                    txBts.Tags.Add(tagBts);
                    transactions.Add(txBts);
                }

                // 4. Mobile Plan on the 10th
                var phoneDate = new DateTime(monthDate.Year, monthDate.Month, 10, 14, 0, 0, DateTimeKind.Utc);
                if (phoneDate <= now)
                {
                    var txPhone = new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = scb.Id,
                        CategoryId = catRent.Id,
                        Amount = 450.00m,
                        TransactionType = "Expense",
                        Date = phoneDate,
                        Description = "AIS Monthly Phone Package",
                        CreatedAt = phoneDate,
                        DeleteFlag = false
                    };
                    txPhone.Tags.Add(tagSub);
                    transactions.Add(txPhone);
                }

                // 5. Goal Contribution on the 26th
                var goalDate = new DateTime(monthDate.Year, monthDate.Month, 26, 11, 0, 0, DateTimeKind.Utc);
                if (goalDate <= now)
                {
                    contributions.Add(new TblSavingsContribution
                    {
                        Id = Guid.NewGuid(),
                        SavingsGoalId = ipadGoal.Id,
                        Amount = 2000.00m,
                        Date = goalDate,
                        Note = "Monthly savings allocation"
                    });
                }

                // 6. Daily Food/Coffee/Transit expenses
                for (int d = 1; d <= daysInMonth; d++)
                {
                    var currentDay = new DateTime(monthDate.Year, monthDate.Month, d, 12, 0, 0, DateTimeKind.Utc);
                    if (currentDay > now) break;

                    // Lunch at Chula canteens
                    var lunchCost = rnd.Next(50, 110);
                    var txLunch = new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = rnd.Next(0, 2) == 0 ? cash.Id : wallet.Id,
                        CategoryId = catFood.Id,
                        Amount = lunchCost,
                        TransactionType = "Expense",
                        Date = currentDay,
                        Description = "Chula Canteen Lunch",
                        CreatedAt = currentDay,
                        DeleteFlag = false
                    };
                    txLunch.Tags.Add(tagCanteen);
                    transactions.Add(txLunch);

                    // Dinner (SCB or Cash)
                    var dinnerCost = rnd.Next(80, 160);
                    transactions.Add(new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = rnd.Next(0, 2) == 0 ? cash.Id : scb.Id,
                        CategoryId = catFood.Id,
                        Amount = dinnerCost,
                        TransactionType = "Expense",
                        Date = currentDay.AddHours(6), // 18:00
                        Description = "Dinner",
                        CreatedAt = currentDay.AddHours(6),
                        DeleteFlag = false
                    });

                    // BTS Trips (Every other day)
                    if (d % 2 == 0)
                    {
                        var tripCost = rnd.Next(35, 50);
                        var txTrip = new TblTransaction
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            AccountId = rabbit.Id,
                            CategoryId = catTransit.Id,
                            Amount = tripCost,
                            TransactionType = "Expense",
                            Date = currentDay.AddHours(-4), // 08:00
                            Description = "BTS Skytrain Commute",
                            CreatedAt = currentDay.AddHours(-4),
                            DeleteFlag = false
                        };
                        txTrip.Tags.Add(tagBts);
                        transactions.Add(txTrip);
                    }
                }

                // 7. Monthly Category Budgets
                context.TblCategoryBudgets.AddRange(
                    new TblCategoryBudget { Id = Guid.NewGuid(), UserId = userId, CategoryId = catFood.Id, LimitAmount = 6000.00m, Month = monthDate.Month, Year = monthDate.Year, CreatedAt = monthDate, DeleteFlag = false },
                    new TblCategoryBudget { Id = Guid.NewGuid(), UserId = userId, CategoryId = catTransit.Id, LimitAmount = 1500.00m, Month = monthDate.Month, Year = monthDate.Year, CreatedAt = monthDate, DeleteFlag = false }
                );
            }

            context.TblTransactions.AddRange(transactions);
            context.TblSavingsContributions.AddRange(contributions);

            // Active schedules
            context.TblRecurringSchedules.AddRange(
                new TblRecurringSchedule
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AccountId = scb.Id,
                    Name = "Rent Payment",
                    Amount = 5000.00m,
                    TransactionType = "Expense",
                    Frequency = "Monthly",
                    StartDate = now,
                    NextOccurrenceDate = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1),
                    DeleteFlag = false
                },
                new TblRecurringSchedule
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AccountId = scb.Id,
                    Name = "Monthly Stipend",
                    Amount = 16000.00m,
                    TransactionType = "Income",
                    Frequency = "Monthly",
                    StartDate = now,
                    NextOccurrenceDate = new DateTime(now.Year, now.Month, 25, 0, 0, 0, DateTimeKind.Utc),
                    DeleteFlag = false
                }
            );

            await context.SaveChangesAsync();
        }

        private static async Task SeedPimDataAsync(AppDbContext context, Guid userId)
        {
            var now = DateTime.UtcNow;

            // Profile settings
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                MonthlyAllowanceAmount = 12000.00m,
                AllowanceDayOfMonth = 1,
                TargetMonthlySavings = 1500.00m,
                Currency = "THB",
                UpdatedAt = now
            };
            context.TblUserProfiles.Add(profile);

            // Accounts
            var kbank = new TblAccount { Id = Guid.NewGuid(), UserId = userId, Name = "Kasikorn Bank", AccountType = AccountType.Bank, Balance = 15200.00m, Color = "#10b981", Icon = "Wallet", CreatedAt = now, DeleteFlag = false };
            var rabbit = new TblAccount { Id = Guid.NewGuid(), UserId = userId, Name = "Rabbit Card", AccountType = AccountType.TransitCard, Balance = 350.00m, Color = "#f59e0b", Icon = "CreditCard", CreatedAt = now, DeleteFlag = false };
            var cash = new TblAccount { Id = Guid.NewGuid(), UserId = userId, Name = "Cash Pocket", AccountType = AccountType.Cash, Balance = 900.00m, Color = "#6b7280", Icon = "Coins", CreatedAt = now, DeleteFlag = false };
            context.TblAccounts.AddRange(kbank, rabbit, cash);

            // Categories
            var catFood = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Food & Coffee", Type = "Expense", Icon = "Coffee", Color = "#f97316", DeleteFlag = false };
            var catDorm = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Dormitory", Type = "Expense", Icon = "Home", Color = "#06b6d4", DeleteFlag = false };
            var catTransit = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Transit", Type = "Expense", Icon = "Train", Color = "#10b981", DeleteFlag = false };
            var catFun = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Entertainment", Type = "Expense", Icon = "Film", Color = "#ec4899", DeleteFlag = false };
            var catAllowance = new TblCategory { Id = Guid.NewGuid(), UserId = userId, Name = "Allowance", Type = "Income", Icon = "Gift", Color = "#10b981", DeleteFlag = false };
            context.TblCategories.AddRange(catFood, catDorm, catTransit, catFun, catAllowance);

            // Tags
            var tagBts = new TblTag { Id = Guid.NewGuid(), UserId = userId, Name = "BTS", Color = "#10b981", DeleteFlag = false };
            var tagSub = new TblTag { Id = Guid.NewGuid(), UserId = userId, Name = "Subscription", Color = "#ef4444", DeleteFlag = false };
            context.TblTags.AddRange(tagBts, tagSub);

            // Savings Goals
            var travelGoal = new TblSavingsGoal
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                GoalName = "Travel to Japan",
                TargetAmount = 25000.00m,
                TargetDate = now.AddMonths(12),
                IsCompleted = false,
                CreatedAt = now.AddMonths(-10),
                DeleteFlag = false
            };
            context.TblSavingsGoals.Add(travelGoal);

            // Seed 1 year of historical transactions (past 12 months)
            var rnd = new Random(24);
            var transactions = new List<TblTransaction>();
            var contributions = new List<TblSavingsContribution>();

            for (int m = -11; m <= 0; m++)
            {
                var monthDate = now.AddMonths(m);
                var daysInMonth = DateTime.DaysInMonth(monthDate.Year, monthDate.Month);

                // 1. Allowance from parents on the 1st
                var allowanceDate = new DateTime(monthDate.Year, monthDate.Month, 1, 9, 30, 0, DateTimeKind.Utc);
                if (allowanceDate <= now)
                {
                    transactions.Add(new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = kbank.Id,
                        CategoryId = catAllowance.Id,
                        Amount = 12000.00m,
                        TransactionType = "Income",
                        Date = allowanceDate,
                        Description = "Monthly Parental Allowance",
                        CreatedAt = allowanceDate,
                        DeleteFlag = false
                    });
                }

                // 2. Dormitory Share on the 1st
                var dormDate = new DateTime(monthDate.Year, monthDate.Month, 1, 10, 0, 0, DateTimeKind.Utc);
                if (dormDate <= now)
                {
                    transactions.Add(new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = kbank.Id,
                        CategoryId = catDorm.Id,
                        Amount = 4000.00m,
                        TransactionType = "Expense",
                        Date = dormDate,
                        Description = "Dorm Room Share Rent",
                        CreatedAt = dormDate,
                        DeleteFlag = false
                    });
                }

                // 3. BTS Card Topup on the 1st
                var btsDate = new DateTime(monthDate.Year, monthDate.Month, 1, 11, 0, 0, DateTimeKind.Utc);
                if (btsDate <= now)
                {
                    var txBts = new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = kbank.Id,
                        CategoryId = catTransit.Id,
                        Amount = 500.00m,
                        TransactionType = "Expense",
                        Date = btsDate,
                        Description = "BTS Topup",
                        CreatedAt = btsDate,
                        DeleteFlag = false
                    };
                    txBts.Tags.Add(tagBts);
                    transactions.Add(txBts);
                }

                // 4. Spotify on the 15th
                var spotifyDate = new DateTime(monthDate.Year, monthDate.Month, 15, 12, 0, 0, DateTimeKind.Utc);
                if (spotifyDate <= now)
                {
                    var txSpotify = new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = kbank.Id,
                        CategoryId = catFun.Id,
                        Amount = 139.00m,
                        TransactionType = "Expense",
                        Date = spotifyDate,
                        Description = "Spotify Premium Account",
                        CreatedAt = spotifyDate,
                        DeleteFlag = false
                    };
                    txSpotify.Tags.Add(tagSub);
                    transactions.Add(txSpotify);
                }

                // 5. Goal Contribution on the 2nd
                var goalDate = new DateTime(monthDate.Year, monthDate.Month, 2, 11, 0, 0, DateTimeKind.Utc);
                if (goalDate <= now)
                {
                    contributions.Add(new TblSavingsContribution
                    {
                        Id = Guid.NewGuid(),
                        SavingsGoalId = travelGoal.Id,
                        Amount = 1500.00m,
                        Date = goalDate,
                        Note = "Monthly Japan trip savings"
                    });
                }

                // 6. Daily Food/Transit expenses
                for (int d = 1; d <= daysInMonth; d++)
                {
                    var currentDay = new DateTime(monthDate.Year, monthDate.Month, d, 13, 0, 0, DateTimeKind.Utc);
                    if (currentDay > now) break;

                    // Daily Food
                    var foodCost = rnd.Next(120, 220);
                    transactions.Add(new TblTransaction
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        AccountId = rnd.Next(0, 2) == 0 ? cash.Id : kbank.Id,
                        CategoryId = catFood.Id,
                        Amount = foodCost,
                        TransactionType = "Expense",
                        Date = currentDay,
                        Description = "Food & Coffee",
                        CreatedAt = currentDay,
                        DeleteFlag = false
                    });

                    // BTS Trips (Every other day)
                    if (d % 2 == 0)
                    {
                        var tripCost = rnd.Next(40, 50);
                        var txTrip = new TblTransaction
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            AccountId = rabbit.Id,
                            CategoryId = catTransit.Id,
                            Amount = tripCost,
                            TransactionType = "Expense",
                            Date = currentDay.AddHours(-4),
                            Description = "BTS Skytrain Ride",
                            CreatedAt = currentDay.AddHours(-4),
                            DeleteFlag = false
                        };
                        txTrip.Tags.Add(tagBts);
                        transactions.Add(txTrip);
                    }
                }

                // 7. Budgets
                context.TblCategoryBudgets.AddRange(
                    new TblCategoryBudget { Id = Guid.NewGuid(), UserId = userId, CategoryId = catFood.Id, LimitAmount = 5500.00m, Month = monthDate.Month, Year = monthDate.Year, CreatedAt = monthDate, DeleteFlag = false },
                    new TblCategoryBudget { Id = Guid.NewGuid(), UserId = userId, CategoryId = catTransit.Id, LimitAmount = 1200.00m, Month = monthDate.Month, Year = monthDate.Year, CreatedAt = monthDate, DeleteFlag = false }
                );
            }

            context.TblTransactions.AddRange(transactions);
            context.TblSavingsContributions.AddRange(contributions);

            await context.SaveChangesAsync();
        }
    }
}
