using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;

namespace ST_finance.Domain.Features
{
    public static class UserDataCleanup
    {
        /// <summary>
        /// Deletes every financial record owned by a user: transactions, categories, tags,
        /// accounts, budgets, recurring schedules, savings goals/contributions, daily quota
        /// logs, notifications, push subscriptions, notification preferences, and the user
        /// profile. Does not delete the TblUser row itself, OTP
        /// verifications, or role/permission assignments — callers handle those separately.
        /// </summary>
        public static async Task DeleteAllUserDataAsync(AppDbContext context, Guid userId)
        {
            var notificationDeliveries = await context.TblNotificationDeliveries
                .Where(d => d.Notification.UserId == userId).ToListAsync();
            context.TblNotificationDeliveries.RemoveRange(notificationDeliveries);

            var notifications = await context.TblNotifications
                .Where(n => n.UserId == userId).ToListAsync();
            context.TblNotifications.RemoveRange(notifications);

            var pushSubscriptions = await context.TblPushSubscriptions
                .Where(s => s.UserId == userId).ToListAsync();
            context.TblPushSubscriptions.RemoveRange(pushSubscriptions);

            var notificationPreferences = await context.TblNotificationPreferences
                .Where(p => p.UserId == userId).ToListAsync();
            context.TblNotificationPreferences.RemoveRange(notificationPreferences);

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
    }
}
