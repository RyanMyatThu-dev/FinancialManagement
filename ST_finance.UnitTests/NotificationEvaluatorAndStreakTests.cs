using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts;
using ST_finance.Domain.Features.Notifications;
using ST_finance.Domain.Features.Transactions;
using ST_finance.Domain.Features.Transactions.Models;
using ST_finance.Shared.Enums;
using Xunit;

namespace ST_finance.UnitTests;

public class NotificationEvaluatorAndStreakTests
{
    [Fact]
    public async Task CreateTransaction_ManualTransaction_StartsStreakAtOne()
    {
        var context = TestDatabaseFixture.CreateContext();
        var userId = Guid.NewGuid();

        var user = new TblUser { Id = userId, UserName = "testuser", Email = "test@example.com" };
        var profile = new TblUserProfile { Id = Guid.NewGuid(), UserId = userId, TimeZoneId = "Asia/Bangkok", CurrentStreak = 0, LongestStreak = 0, LastLoggedDate = null };
        var account = new TblAccount { UserId = userId, Name = "Main", AccountType = AccountType.Bank, Balance = 1000m, Color = "#4F46E5", Icon = "Wallet" };
        var category = new TblCategory { UserId = userId, Name = "Food", Type = "Expense", Color = "#4F46E5", Icon = "Wallet" };

        context.TblUsers.Add(user);
        context.TblUserProfiles.Add(profile);
        context.TblAccounts.Add(account);
        context.TblCategories.Add(category);
        await context.SaveChangesAsync();

        var accountService = new AccountService(context);
        var service = new TransactionService(context, accountService, Microsoft.Extensions.Logging.Abstractions.NullLogger<TransactionService>.Instance);

        var request = new TransactionRequest
        {
            AccountId = account.Id,
            CategoryId = category.Id,
            Amount = 50m,
            TransactionType = "Expense",
            Date = DateTime.UtcNow,
            IsRecurring = false
        };

        var result = await service.CreateTransactionAsync(userId, request);

        Assert.True(result.IsSuccess);
        var updatedProfile = await context.TblUserProfiles.FirstAsync(p => p.UserId == userId);
        Assert.Equal(1, updatedProfile.CurrentStreak);
        Assert.Equal(1, updatedProfile.LongestStreak);
        Assert.NotNull(updatedProfile.LastLoggedDate);
    }

    [Fact]
    public async Task CreateTransaction_ManualTransaction_IncrementsStreakWhenLoggedYesterday()
    {
        var context = TestDatabaseFixture.CreateContext();
        var userId = Guid.NewGuid();
        var todayBkk = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var yesterdayBkk = todayBkk.AddDays(-1);

        var user = new TblUser { Id = userId, UserName = "streakuser", Email = "streak@example.com" };
        var profile = new TblUserProfile { Id = Guid.NewGuid(), UserId = userId, TimeZoneId = "Asia/Bangkok", CurrentStreak = 4, LongestStreak = 4, LastLoggedDate = yesterdayBkk };
        var account = new TblAccount { UserId = userId, Name = "Main", AccountType = AccountType.Bank, Balance = 1000m, Color = "#4F46E5", Icon = "Wallet" };

        context.TblUsers.Add(user);
        context.TblUserProfiles.Add(profile);
        context.TblAccounts.Add(account);
        await context.SaveChangesAsync();

        var accountService = new AccountService(context);
        var service = new TransactionService(context, accountService, Microsoft.Extensions.Logging.Abstractions.NullLogger<TransactionService>.Instance);

        var request = new TransactionRequest
        {
            AccountId = account.Id,
            Amount = 30m,
            TransactionType = "Expense",
            Date = DateTime.UtcNow,
            IsRecurring = false
        };

        var result = await service.CreateTransactionAsync(userId, request);

        Assert.True(result.IsSuccess);
        var updatedProfile = await context.TblUserProfiles.FirstAsync(p => p.UserId == userId);
        Assert.Equal(5, updatedProfile.CurrentStreak);
        Assert.Equal(5, updatedProfile.LongestStreak);
        Assert.Equal(todayBkk, updatedProfile.LastLoggedDate);
    }

    [Fact]
    public async Task DailyReminderEvaluator_CreatesNotification_WithDdMmYyyyFormat()
    {
        var context = TestDatabaseFixture.CreateContext();
        var userId = Guid.NewGuid();
        var nowUtc = DateTime.UtcNow;

        var user = new TblUser { Id = userId, UserName = "reminderuser", Email = "reminder@example.com" };
        var profile = new TblUserProfile { Id = Guid.NewGuid(), UserId = userId, TimeZoneId = "Asia/Bangkok" };
        var pref = new TblNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DailyReminderEnabled = true,
            DailyReminderTime = new TimeOnly(20, 0),
            NextDailyReminderAt = nowUtc.AddMinutes(-10),
            QuietHoursStart = null,
            QuietHoursEnd = null
        };

        context.TblUsers.Add(user);
        context.TblUserProfiles.Add(profile);
        context.TblNotificationPreferences.Add(pref);
        await context.SaveChangesAsync();

        var evaluator = new DailyReminderNotificationService(context);
        await evaluator.EvaluateAsync();

        var noti = await context.TblNotifications.FirstOrDefaultAsync(n => n.UserId == userId);
        Assert.NotNull(noti);
        Assert.Equal("DailyReminder", noti.Type);
        Assert.StartsWith("daily-reminder:", noti.DedupeKey);

        // Verify dedupe key follows dd-MM-yyyy format (length is 10 chars for date)
        var datePart = noti.DedupeKey!.Substring("daily-reminder:".Length);
        Assert.Matches(@"^\d{2}-\d{2}-\d{4}$", datePart);

        // Verify preference advanced
        var updatedPref = await context.TblNotificationPreferences.FirstAsync(p => p.UserId == userId);
        Assert.True(updatedPref.NextDailyReminderAt > nowUtc);
    }

    [Fact]
    public async Task FunNotificationEvaluator_CreatesStreakSaverNotification()
    {
        var context = TestDatabaseFixture.CreateContext();
        var userId = Guid.NewGuid();
        var todayBkk = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
        var yesterdayBkk = todayBkk.AddDays(-1);

        var user = new TblUser { Id = userId, UserName = "funuser", Email = "fun@example.com" };
        var profile = new TblUserProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TimeZoneId = "Asia/Bangkok",
            CurrentStreak = 3,
            LongestStreak = 3,
            LastLoggedDate = yesterdayBkk
        };
        var pref = new TblNotificationPreference
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FunNotificationsEnabled = true
        };

        context.TblUsers.Add(user);
        context.TblUserProfiles.Add(profile);
        context.TblNotificationPreferences.Add(pref);
        await context.SaveChangesAsync();

        var evaluator = new FunNotificationEvalutor(context);
        await evaluator.EvaluateAsync();

        var noti = await context.TblNotifications.FirstOrDefaultAsync(n => n.UserId == userId);
        Assert.NotNull(noti);
        Assert.Equal("FunNotification", noti.Type);
        Assert.Contains("streak-saver", noti.DedupeKey);
        Assert.Contains("3-day streak", noti.Body);
    }
}
