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

        [Fact]
        public async Task ContributeToGoal_ShouldFail_WhenContributionExceedsTarget()
        {
            // Seed goal
            var goal = new TblSavingsGoal { UserId = _userId, GoalName = "Keyboard", TargetAmount = 3000m, IsCompleted = false };
            _context.TblSavingsGoals.Add(goal);

            // Seed account
            var account = new TblAccount { UserId = _userId, Name = "Main Bank", Balance = 10000m, AccountType = AccountType.Bank, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            // Contribute 2000 first (succeeds)
            var req1 = new ContributeRequest(2000m, "Save 1");
            var res1 = await _service.ContributeToGoalAsync(_userId, goal.Id, req1);
            Assert.True(res1.IsSuccess);

            // Contribute 1500 next (fails because 2000 + 1500 > 3000)
            var req2 = new ContributeRequest(1500m, "Save 2");
            var res2 = await _service.ContributeToGoalAsync(_userId, goal.Id, req2);

            Assert.True(res2.IsFailure);
            Assert.Contains("would exceed the target amount", res2.Error.Message.ToLower());
            Assert.Contains("remaining needed is 1000", res2.Error.Message.ToLower());
        }

        [Fact]
        public async Task ContributeToGoal_ShouldExcludeCompletedGoals_FromEarmarkedSavings()
        {
            // Seed a completed goal with 3000 THB contributions
            var completedGoal = new TblSavingsGoal { UserId = _userId, GoalName = "Completed Goal", TargetAmount = 3000m, IsCompleted = true };
            _context.TblSavingsGoals.Add(completedGoal);
            
            var contribution = new TblSavingsContribution { Id = Guid.NewGuid(), SavingsGoalId = completedGoal.Id, Amount = 3000m, Date = DateTime.UtcNow };
            _context.TblSavingsContributions.Add(contribution);

            // Seed an active goal
            var activeGoal = new TblSavingsGoal { UserId = _userId, GoalName = "Active Goal", TargetAmount = 5000m, IsCompleted = false };
            _context.TblSavingsGoals.Add(activeGoal);

            // Seed account with 4000 THB balance
            var account = new TblAccount { UserId = _userId, Name = "Main Bank", Balance = 4000m, AccountType = AccountType.Bank, Color = "#4F46E5", Icon = "Wallet" };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            // If completed goals are excluded, totalSavings is 0. Disposable balance is 4000 - 0 = 4000.
            // Contributing 2500 should succeed.
            // If completed goals are NOT excluded, totalSavings is 3000. Disposable balance is 4000 - 3000 = 1000, and contributing 2500 would fail.
            var request = new ContributeRequest(2500m, "Save");
            var result = await _service.ContributeToGoalAsync(_userId, activeGoal.Id, request);

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task GetCompletedGoals_ShouldSortCorrectly()
        {
            // Seed completed goals with different dates
            var goal1 = new TblSavingsGoal { Id = Guid.NewGuid(), UserId = _userId, GoalName = "Goal 1", TargetAmount = 1000m, IsCompleted = true, CreatedAt = DateTime.UtcNow.AddDays(-10), CompletedAt = DateTime.UtcNow.AddDays(-5), TargetDate = DateTime.UtcNow.AddDays(5), DeleteFlag = false };
            var goal2 = new TblSavingsGoal { Id = Guid.NewGuid(), UserId = _userId, GoalName = "Goal 2", TargetAmount = 1000m, IsCompleted = true, CreatedAt = DateTime.UtcNow.AddDays(-5), CompletedAt = DateTime.UtcNow.AddDays(-8), TargetDate = DateTime.UtcNow.AddDays(10), DeleteFlag = false };
            _context.TblSavingsGoals.AddRange(goal1, goal2);
            await _context.SaveChangesAsync();

            // Sort by CreatedAt (descending) -> Goal 2 (5 days ago) should be first
            var resultCreated = await _service.GetCompletedGoalsAsync(_userId, 1, 10, "CreatedAt");
            Assert.True(resultCreated.IsSuccess);
            Assert.Equal("Goal 2", resultCreated.Value.Items.First().GoalName);

            // Sort by CompletedAt (descending) -> Goal 1 (5 days ago) should be first
            var resultCompleted = await _service.GetCompletedGoalsAsync(_userId, 1, 10, "CompletedAt");
            Assert.True(resultCompleted.IsSuccess);
            Assert.Equal("Goal 1", resultCompleted.Value.Items.First().GoalName);

            // Sort by TargetDate (descending) -> Goal 2 (10 days in future) should be first
            var resultTarget = await _service.GetCompletedGoalsAsync(_userId, 1, 10, "TargetDate");
            Assert.True(resultTarget.IsSuccess);
            Assert.Equal("Goal 2", resultTarget.Value.Items.First().GoalName);
        }
    }
}
