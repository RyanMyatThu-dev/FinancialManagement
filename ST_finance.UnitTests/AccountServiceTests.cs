using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts;
using ST_finance.Domain.Features.Accounts.Models;
using ST_finance.Shared.Enums;
using Xunit;

namespace ST_finance.UnitTests
{
    public class AccountServiceTests
    {
        private readonly AppDbContext _context;
        private readonly AccountService _service;
        private readonly Guid _userId = Guid.NewGuid();

        public AccountServiceTests()
        {
            _context = TestDatabaseFixture.CreateContext();
            _service = new AccountService(_context);
        }

        [Fact]
        public async Task CreateAccount_ShouldFail_WhenRequestIsNull()
        {
            var result = await _service.CreateAccountAsync(_userId, null!);

            Assert.True(result.IsFailure);
            Assert.Contains("cannot be null", result.Error.Message);
        }

        [Fact]
        public async Task CreateAccount_ShouldFail_WhenNameIsEmpty()
        {
            var request = new CreateAccountRequest("", AccountType.Bank, 100m);
            var result = await _service.CreateAccountAsync(_userId, request);

            Assert.True(result.IsFailure);
            Assert.Contains("name is required", result.Error.Message.ToLower());
        }

        [Fact]
        public async Task CreateAccount_ShouldFail_WhenTypeIsNone()
        {
            var request = new CreateAccountRequest("Savings", AccountType.None, 100m);
            var result = await _service.CreateAccountAsync(_userId, request);

            Assert.True(result.IsFailure);
            Assert.Contains("account type must be", result.Error.Message.ToLower());
        }

        [Fact]
        public async Task CreateAccount_ShouldFail_WhenBalanceIsNegative()
        {
            var request = new CreateAccountRequest("Savings", AccountType.Bank, -50m);
            var result = await _service.CreateAccountAsync(_userId, request);

            Assert.True(result.IsFailure);
            Assert.Contains("cannot be negative", result.Error.Message.ToLower());
        }

        [Fact]
        public async Task CreateAccount_ShouldFail_WhenNameIsDuplicate()
        {
            var firstRequest = new CreateAccountRequest("Savings", AccountType.Bank, 100m);
            await _service.CreateAccountAsync(_userId, firstRequest);

            var secondRequest = new CreateAccountRequest("savings", AccountType.EWallet, 200m);
            var result = await _service.CreateAccountAsync(_userId, secondRequest);

            Assert.True(result.IsFailure);
        }

        [Fact]
        public async Task CreateAccount_ShouldSucceed_AndSaveToDatabase()
        {
            var request = new CreateAccountRequest("Primary Bank", AccountType.Bank, 500m);
            var result = await _service.CreateAccountAsync(_userId, request);

            Assert.True(result.IsSuccess);
            Assert.Equal("Primary Bank", result.Value.Name);
            Assert.Equal(500m, result.Value.Balance);

            var savedAccount = await _context.TblAccounts.FirstOrDefaultAsync(a => a.UserId == _userId && a.Name == "Primary Bank");
            Assert.NotNull(savedAccount);
            Assert.Equal(AccountType.Bank, savedAccount.AccountType);
        }

        [Fact]
        public async Task GetAccounts_ShouldReturnFilteredAndPaginatedResults()
        {
            // Seed
            _context.TblAccounts.Add(new TblAccount { UserId = _userId, Name = "Alpha", AccountType = AccountType.Bank, Balance = 100, Color = "#4F46E5", Icon = "Wallet" });
            _context.TblAccounts.Add(new TblAccount { UserId = _userId, Name = "Beta", AccountType = AccountType.EWallet, Balance = 200, Color = "#4F46E5", Icon = "Wallet" });
            _context.TblAccounts.Add(new TblAccount { UserId = _userId, Name = "Gamma", AccountType = AccountType.Bank, Balance = 300, Color = "#4F46E5", Icon = "Wallet" });
            await _context.SaveChangesAsync();

            var request = new GetAccountsRequest { Search = "a", Type = AccountType.Bank };
            var result = await _service.GetAccountsAsync(_userId, 1, 10, request);

            Assert.True(result.IsSuccess);
            Assert.Equal(2, result.Value.TotalCount); // Alpha and Gamma contain 'a' and are Bank
            Assert.Equal("Alpha", result.Value.Items.First().Name);
        }

        [Fact]
        public async Task UpdateAccount_ShouldSucceed_AndModifyDatabase()
        {
            var account = new TblAccount { UserId = _userId, Name = "Old Name", AccountType = AccountType.Bank, Balance = 100, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            var updateRequest = new UpdateAccountRequest("New Name", "#4F46E5", "Wallet", 100m);
            var result = await _service.UpdateAccountAsync(_userId, account.Id, updateRequest);

            Assert.True(result.IsSuccess);
            Assert.Equal("New Name", result.Value.Name);
            Assert.Equal(AccountType.Bank, result.Value.AccountType);
        }

        [Fact]
        public async Task DeleteAccount_ShouldSoftDelete_BySettingDeleteFlag()
        {
            var account = new TblAccount { UserId = _userId, Name = "ToDelete", AccountType = AccountType.Bank, Balance = 100, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            var result = await _service.DeleteAccountAsync(_userId, account.Id, force: false);

            Assert.True(result.IsSuccess);

            // Fetch directly bypassing global query filter to verify DeleteFlag is set to true
            var deletedAccount = await _context.TblAccounts
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(a => a.Id == account.Id);

            Assert.NotNull(deletedAccount);
            Assert.True(deletedAccount.DeleteFlag);
        }

        [Fact]
        public async Task CreditAndDebitAccount_ShouldChangeBalanceCorrectly()
        {
            var account = new TblAccount { UserId = _userId, Name = "Wallet", AccountType = AccountType.Cash, Balance = 100, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            var creditResult = await _service.CreditAccountAsync(_userId, account.Id, 50m);
            Assert.True(creditResult.IsSuccess);

            var dbAccount = await _context.TblAccounts.FindAsync(account.Id);
            Assert.Equal(150m, dbAccount!.Balance);

            var debitResult = await _service.DebitAccountAsync(_userId, account.Id, 30m);
            Assert.True(debitResult.IsSuccess);

            dbAccount = await _context.TblAccounts.FindAsync(account.Id);
            Assert.Equal(120m, dbAccount!.Balance);
        }
    }
}
