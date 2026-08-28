using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features;
using ST_finance.Shared.Enums;
using Xunit;

namespace ST_finance.UnitTests
{
    public class UserDataCleanupTests
    {
        private readonly AppDbContext _context;
        private readonly Guid _userId = Guid.NewGuid();

        public UserDataCleanupTests()
        {
            _context = TestDatabaseFixture.CreateContext();
        }

        [Fact]
        public async Task DeleteAllUserDataAsync_RemovesEveryUserOwnedEntityType()
        {
            var account = new TblAccount { UserId = _userId, Name = "Main Bank", AccountType = AccountType.Bank, Balance = 100m, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);

            var category = new TblCategory { UserId = _userId, Name = "Food", Type = "Expense", Color = "#4F46E5", Icon = "Wallet" };
            _context.TblCategories.Add(category);

            var tag = new TblTag { UserId = _userId, Name = "Essential", Color = "#4F46E5" };
            _context.TblTags.Add(tag);

            var profile = new TblUserProfile { UserId = _userId, TargetMonthlySavings = 0m, Currency = "THB", EnableQuotaPacing = true };
            _context.TblUserProfiles.Add(profile);

            await _context.SaveChangesAsync();

            var transaction = new TblTransaction
            {
                UserId = _userId,
                AccountId = account.Id,
                CategoryId = category.Id,
                TransactionType = "Expense",
                Date = DateTime.UtcNow,
                Amount = 50m,
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            _context.TblTransactions.Add(transaction);

            var budget = new TblCategoryBudget { UserId = _userId, CategoryId = category.Id, LimitAmount = 100m, Month = 1, Year = 2026, CreatedAt = DateTime.UtcNow, DeleteFlag = false };
            _context.TblCategoryBudgets.Add(budget);

            var schedule = new TblRecurringSchedule
            {
                UserId = _userId,
                AccountId = account.Id,
                Name = "Rent",
                Amount = 100m,
                TransactionType = "Expense",
                Frequency = "Monthly",
                StartDate = DateTime.UtcNow,
                NextOccurrenceDate = DateTime.UtcNow,
                DeleteFlag = false
            };
            _context.TblRecurringSchedules.Add(schedule);

            var goal = new TblSavingsGoal { UserId = _userId, GoalName = "Trip", TargetAmount = 1000m, IsCompleted = false };
            _context.TblSavingsGoals.Add(goal);

            var quotaLog = new TblDailyQuotaLog { UserId = _userId, Date = DateOnly.FromDateTime(DateTime.UtcNow), TargetQuota = 50m, ActualSpent = 20m, CreatedAt = DateTime.UtcNow };
            _context.TblDailyQuotaLogs.Add(quotaLog);

            await _context.SaveChangesAsync();

            var contribution = new TblSavingsContribution { SavingsGoalId = goal.Id, Amount = 50m, Date = DateTime.UtcNow };
            _context.TblSavingsContributions.Add(contribution);
            await _context.SaveChangesAsync();

            await UserDataCleanup.DeleteAllUserDataAsync(_context, _userId);

            Assert.Empty(_context.TblAccounts.IgnoreQueryFilters().Where(a => a.UserId == _userId));
            Assert.Empty(_context.TblCategories.IgnoreQueryFilters().Where(c => c.UserId == _userId));
            Assert.Empty(_context.TblTags.IgnoreQueryFilters().Where(t => t.UserId == _userId));
            Assert.Empty(_context.TblUserProfiles.IgnoreQueryFilters().Where(p => p.UserId == _userId));
            Assert.Empty(_context.TblTransactions.IgnoreQueryFilters().Where(t => t.UserId == _userId));
            Assert.Empty(_context.TblCategoryBudgets.IgnoreQueryFilters().Where(b => b.UserId == _userId));
            Assert.Empty(_context.TblRecurringSchedules.IgnoreQueryFilters().Where(s => s.UserId == _userId));
            Assert.Empty(_context.TblSavingsGoals.IgnoreQueryFilters().Where(g => g.UserId == _userId));
            Assert.Empty(_context.TblDailyQuotaLogs.IgnoreQueryFilters().Where(l => l.UserId == _userId));
            Assert.Empty(_context.TblSavingsContributions.IgnoreQueryFilters().Where(c => c.SavingsGoal.UserId == _userId));
        }

        [Fact]
        public async Task DeleteAllUserDataAsync_DoesNotAffectOtherUsersData()
        {
            var otherUserId = Guid.NewGuid();
            var otherAccount = new TblAccount { UserId = otherUserId, Name = "Other Bank", AccountType = AccountType.Bank, Balance = 500m, Color = "#000000", Icon = "Wallet" };
            _context.TblAccounts.Add(otherAccount);

            var myAccount = new TblAccount { UserId = _userId, Name = "My Bank", AccountType = AccountType.Bank, Balance = 100m, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(myAccount);
            await _context.SaveChangesAsync();

            await UserDataCleanup.DeleteAllUserDataAsync(_context, _userId);

            Assert.Empty(_context.TblAccounts.IgnoreQueryFilters().Where(a => a.UserId == _userId));
            Assert.Single(_context.TblAccounts.IgnoreQueryFilters().Where(a => a.UserId == otherUserId));
        }
    }
}
