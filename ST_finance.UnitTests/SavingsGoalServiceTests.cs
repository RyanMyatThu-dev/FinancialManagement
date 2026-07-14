using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.SavingsGoals;
using ST_finance.Domain.Features.SavingsGoals.Models;
using ST_finance.Shared.Enums;
using Xunit;

namespace ST_finance.UnitTests
{
    public class SavingsGoalServiceTests
    {
        private readonly AppDbContext _context;
        private readonly SavingsGoalService _service;
        private readonly Guid _userId = Guid.NewGuid();

        public SavingsGoalServiceTests()
        {
            _context = TestDatabaseFixture.CreateContext();
            _service = new SavingsGoalService(_context);
        }

        [Fact]
        public async Task CreateGoal_ShouldFail_WhenTargetAmountIsZeroOrNegative()
        {
            var request = new CreateSavingsGoalRequest("New Laptop", 0m, DateTime.UtcNow.AddDays(30));
            var result = await _service.CreateGoalAsync(_userId, request);

            Assert.True(result.IsFailure);
            Assert.Contains("must be greater than zero", result.Error.Message.ToLower());
        }

        [Fact]
        public async Task CreateGoal_ShouldFail_WhenTargetDateIsInPast()
        {
            var request = new CreateSavingsGoalRequest("New Laptop", 1000m, DateTime.UtcNow.AddDays(-1));
            var result = await _service.CreateGoalAsync(_userId, request);

            Assert.True(result.IsFailure);
            Assert.Contains("must be in the future", result.Error.Message.ToLower());
        }

        [Fact]
        public async Task CreateGoal_ShouldSucceed_AndSaveToDatabase()
        {
            var request = new CreateSavingsGoalRequest("Switch Console", 12000m, DateTime.UtcNow.AddDays(60));
            var result = await _service.CreateGoalAsync(_userId, request);

            Assert.True(result.IsSuccess);
            Assert.Equal("Switch Console", result.Value.GoalName);
            Assert.Equal(12000m, result.Value.TargetAmount);

            var saved = await _context.TblSavingsGoals.FindAsync(result.Value.Id);
            Assert.NotNull(saved);
            Assert.Equal("Switch Console", saved.GoalName);
        }

        [Fact]
        public async Task ContributeToGoal_ShouldFail_WhenDisposableBalanceIsInsufficient()
        {
            // Seed a goal
            var goal = new TblSavingsGoal { UserId = _userId, GoalName = "Dorm Deposit", TargetAmount = 5000m, IsCompleted = false };
            _context.TblSavingsGoals.Add(goal);

            // Seed an account with only 1000 THB balance
            var account = new TblAccount { UserId = _userId, Name = "Main Bank", Balance = 1000m, AccountType = AccountType.Bank, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            // Try to contribute 2000 THB (which exceeds 1000 THB total balance)
            var request = new ContributeRequest(2000m, "Contribution");
            var result = await _service.ContributeToGoalAsync(_userId, goal.Id, request);

            Assert.True(result.IsFailure);
            Assert.Contains("insufficient disposable balance", result.Error.Message.ToLower());
        }

        [Fact]
        public async Task ContributeToGoal_ShouldSucceed_AndAddContributionRecord()
        {
            // Seed goal
            var goal = new TblSavingsGoal { UserId = _userId, GoalName = "Dorm Deposit", TargetAmount = 5000m, IsCompleted = false };
            _context.TblSavingsGoals.Add(goal);

            // Seed account with enough balance
            var account = new TblAccount { UserId = _userId, Name = "Main Bank", Balance = 10000m, AccountType = AccountType.Bank, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            var request = new ContributeRequest(3000m, "Monthly save");
            var result = await _service.ContributeToGoalAsync(_userId, goal.Id, request);

            Assert.True(result.IsSuccess);
            Assert.Equal(3000m, result.Value.CurrentAmount);

            var contribution = await _context.TblSavingsContributions.FirstOrDefaultAsync(c => c.SavingsGoalId == goal.Id);
            Assert.NotNull(contribution);
            Assert.Equal(3000m, contribution.Amount);
        }

        [Fact]
        public async Task CompleteGoal_ShouldSucceed_AndSetCompletionDetails()
        {
            var goal = new TblSavingsGoal { UserId = _userId, GoalName = "Done Goal", TargetAmount = 1000m, IsCompleted = false };
            _context.TblSavingsGoals.Add(goal);

            // Seed account with enough balance and add contribution
            var account = new TblAccount { UserId = _userId, Name = "Main Bank", Balance = 5000m, AccountType = AccountType.Bank, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            // Contribute to goal to reach target amount
            var contributeRequest = new ContributeRequest(1000m, "Initial saving");
            await _service.ContributeToGoalAsync(_userId, goal.Id, contributeRequest);

            var result = await _service.CompleteGoalAsync(_userId, goal.Id);

            Assert.True(result.IsSuccess);
            Assert.True(result.Value.IsCompleted);

            var saved = await _context.TblSavingsGoals.FindAsync(goal.Id);
            Assert.True(saved!.IsCompleted);
            Assert.NotNull(saved.CompletedAt);
        }

        [Fact]
        public async Task DeleteGoal_ShouldSoftDeleteGoal()
        {
            var goal = new TblSavingsGoal { UserId = _userId, GoalName = "Delete Me", TargetAmount = 1000m, IsCompleted = false };
            _context.TblSavingsGoals.Add(goal);
            await _context.SaveChangesAsync();

            var result = await _service.DeleteGoalAsync(_userId, goal.Id);

            Assert.True(result.IsSuccess);

            var saved = await _context.TblSavingsGoals.IgnoreQueryFilters().FirstOrDefaultAsync(g => g.Id == goal.Id);
            Assert.True(saved!.DeleteFlag);
        }
    }
}
