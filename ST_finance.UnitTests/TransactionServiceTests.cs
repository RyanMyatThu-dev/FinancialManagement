using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts;
using ST_finance.Domain.Features.Transactions;
using ST_finance.Domain.Features.Transactions.Models;
using ST_finance.Shared.Enums;
using Xunit;

namespace ST_finance.UnitTests
{
    public class TransactionServiceTests
    {
        private readonly AppDbContext _context;
        private readonly AccountService _accountService;
        private readonly TransactionService _service;
        private readonly Guid _userId = Guid.NewGuid();
        private readonly Guid _accountId;
        private readonly Guid _categoryId;

        public TransactionServiceTests()
        {
            _context = TestDatabaseFixture.CreateContext();
            _accountService = new AccountService(_context);
            _service = new TransactionService(_context, _accountService);

            // Seed initial data
            var account = new TblAccount { UserId = _userId, Name = "Main Bank", AccountType = AccountType.Bank, Balance = 1000m, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);

            var category = new TblCategory { UserId = _userId, Name = "Food", Type = "Expense", Color = "#4F46E5", Icon = "Wallet" };
            _context.TblCategories.Add(category);

            _context.SaveChanges();
            _accountId = account.Id;
            _categoryId = category.Id;
        }

        [Fact]
        public async Task CreateTransaction_ShouldSucceed_AndDeductBalanceForExpense()
        {
            var request = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = 150m,
                TransactionType = "Expense",
                Description = "Lunch",
                Date = DateTime.UtcNow
            };

            var result = await _service.CreateTransactionAsync(_userId, request);

            Assert.True(result.IsSuccess);
            Assert.Equal(150m, result.Value.Amount);

            // Verify account balance is deducted (1000 - 150 = 850)
            var account = await _context.TblAccounts.FindAsync(_accountId);
            Assert.Equal(850m, account!.Balance);

            // Verify transaction saved
            var tx = await _context.TblTransactions.FindAsync(result.Value.Id);
            Assert.NotNull(tx);
            Assert.Equal(150m, tx.Amount);
        }

        [Fact]
        public async Task CreateTransaction_ShouldSucceed_AndAddBalanceForIncome()
        {
            var request = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = 500m,
                TransactionType = "Income",
                Description = "Freelance",
                Date = DateTime.UtcNow
            };

            var result = await _service.CreateTransactionAsync(_userId, request);

            Assert.True(result.IsSuccess);

            // Verify account balance is credited (1000 + 500 = 1500)
            var account = await _context.TblAccounts.FindAsync(_accountId);
            Assert.Equal(1500m, account!.Balance);
        }

        [Fact]
        public async Task CreateTransaction_ShouldFail_WhenAmountIsNegative()
        {
            var request = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = -50m,
                TransactionType = "Expense",
                Description = "Invalid",
                Date = DateTime.UtcNow
            };

            var result = await _service.CreateTransactionAsync(_userId, request);

            Assert.True(result.IsFailure);
        }

        [Fact]
        public async Task UpdateTransaction_ShouldAdjustBalanceCorrectly()
        {
            // Seed a transaction
            var request = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = 100m,
                TransactionType = "Expense",
                Description = "Lunch",
                Date = DateTime.UtcNow
            };
            var createResult = await _service.CreateTransactionAsync(_userId, request);

            // Balance should now be 900
            var account = await _context.TblAccounts.FindAsync(_accountId);
            Assert.Equal(900m, account!.Balance);

            // Update amount to 150 (expense)
            var updateRequest = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = 150m,
                TransactionType = "Expense",
                Description = "Bigger Lunch",
                Date = DateTime.UtcNow
            };
            var updateResult = await _service.UpdateTransactionAsync(_userId, createResult.Value.Id, updateRequest);

            Assert.True(updateResult.IsSuccess);

            // Balance should be 850 (1000 - 150)
            account = await _context.TblAccounts.FindAsync(_accountId);
            Assert.Equal(850m, account!.Balance);
        }

        [Fact]
        public async Task DeleteTransaction_ShouldRevertBalance_AndSoftDelete()
        {
            // Seed transaction
            var request = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = 200m,
                TransactionType = "Expense",
                Description = "Shopping",
                Date = DateTime.UtcNow
            };
            var createResult = await _service.CreateTransactionAsync(_userId, request);

            // Balance is 800
            var account = await _context.TblAccounts.FindAsync(_accountId);
            Assert.Equal(800m, account!.Balance);

            // Delete
            var deleteResult = await _service.DeleteTransactionAsync(_userId, createResult.Value.Id);
            Assert.True(deleteResult.IsSuccess);

            // Balance is reverted to 1000
            account = await _context.TblAccounts.FindAsync(_accountId);
            Assert.Equal(1000m, account!.Balance);

            // Verify soft-deleted
            var tx = await _context.TblTransactions.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == createResult.Value.Id);
            Assert.NotNull(tx);
            Assert.True(tx.DeleteFlag);
        }

        [Fact]
        public async Task CreatePastTransaction_ShouldUpdateDailyQuotaLog()
        {
            var pastDate = DateTime.UtcNow.AddDays(-2);
            var localDate = DateOnly.FromDateTime(pastDate.AddHours(7));

            // Seed a daily quota log for that past date
            var quotaLog = new TblDailyQuotaLog
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Date = localDate,
                TargetQuota = 500m,
                ActualSpent = 0m,
                CreatedAt = DateTime.UtcNow
            };
            _context.TblDailyQuotaLogs.Add(quotaLog);
            await _context.SaveChangesAsync();

            var request = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = 150m,
                TransactionType = "Expense",
                Description = "Past Lunch",
                Date = pastDate
            };

            var result = await _service.CreateTransactionAsync(_userId, request);
            Assert.True(result.IsSuccess);

            // Verify quota log was updated
            var updatedLog = await _context.TblDailyQuotaLogs.FindAsync(quotaLog.Id);
            Assert.NotNull(updatedLog);
            Assert.Equal(150m, updatedLog.ActualSpent);
        }

        [Fact]
        public async Task UpdatePastTransaction_ShouldUpdateDailyQuotaLogForBothOldAndNewDates()
        {
            var oldDate = DateTime.UtcNow.AddDays(-3);
            var newDate = DateTime.UtcNow.AddDays(-2);

            var oldLocalDate = DateOnly.FromDateTime(oldDate.AddHours(7));
            var newLocalDate = DateOnly.FromDateTime(newDate.AddHours(7));

            // Seed daily quota logs for both dates
            var oldLog = new TblDailyQuotaLog { Id = Guid.NewGuid(), UserId = _userId, Date = oldLocalDate, TargetQuota = 500m, ActualSpent = 150m, CreatedAt = DateTime.UtcNow };
            var newLog = new TblDailyQuotaLog { Id = Guid.NewGuid(), UserId = _userId, Date = newLocalDate, TargetQuota = 500m, ActualSpent = 0m, CreatedAt = DateTime.UtcNow };
            _context.TblDailyQuotaLogs.AddRange(oldLog, newLog);

            // Seed transaction on old date
            var tx = new TblTransaction
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                AccountId = _accountId,
                CategoryId = _categoryId,
                TransactionType = "Expense",
                Amount = 150m,
                Description = "Past Expense",
                Date = oldDate,
                DeleteFlag = false
            };
            _context.TblTransactions.Add(tx);
            await _context.SaveChangesAsync();

            // Update transaction to new date and new amount
            var request = new TransactionRequest
            {
                AccountId = _accountId,
                CategoryId = _categoryId,
                Amount = 250m,
                TransactionType = "Expense",
                Description = "Updated Past Expense",
                Date = newDate
            };

            var result = await _service.UpdateTransactionAsync(_userId, tx.Id, request);
            Assert.True(result.IsSuccess);

            // Verify old log actual spent became 0
            var updatedOldLog = await _context.TblDailyQuotaLogs.FindAsync(oldLog.Id);
            Assert.Equal(0m, updatedOldLog!.ActualSpent);

            // Verify new log actual spent became 250
            var updatedNewLog = await _context.TblDailyQuotaLogs.FindAsync(newLog.Id);
            Assert.Equal(250m, updatedNewLog!.ActualSpent);
        }

        [Fact]
        public async Task DeletePastTransaction_ShouldUpdateDailyQuotaLog()
        {
            var pastDate = DateTime.UtcNow.AddDays(-2);
            var localDate = DateOnly.FromDateTime(pastDate.AddHours(7));

            // Seed daily quota log and transaction
            var quotaLog = new TblDailyQuotaLog { Id = Guid.NewGuid(), UserId = _userId, Date = localDate, TargetQuota = 500m, ActualSpent = 150m, CreatedAt = DateTime.UtcNow };
            _context.TblDailyQuotaLogs.Add(quotaLog);

            var tx = new TblTransaction
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                AccountId = _accountId,
                CategoryId = _categoryId,
                TransactionType = "Expense",
                Amount = 150m,
                Description = "Expense to delete",
                Date = pastDate,
                DeleteFlag = false
            };
            _context.TblTransactions.Add(tx);
            await _context.SaveChangesAsync();

            // Delete transaction
            var result = await _service.DeleteTransactionAsync(_userId, tx.Id);
            Assert.True(result.IsSuccess);

            // Verify quota log was updated to 0
            var updatedLog = await _context.TblDailyQuotaLogs.FindAsync(quotaLog.Id);
            Assert.NotNull(updatedLog);
            Assert.Equal(0m, updatedLog.ActualSpent);
        }
    }
}
