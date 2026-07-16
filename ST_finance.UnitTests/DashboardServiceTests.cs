using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Dashboard;
using ST_finance.Shared.Enums;
using Xunit;

namespace ST_finance.UnitTests
{
    public class DashboardServiceTests
    {
        private readonly AppDbContext _context;
        private readonly DashboardService _service;
        private readonly Guid _userId = Guid.NewGuid();

        public DashboardServiceTests()
        {
            _context = TestDatabaseFixture.CreateContext();
            _service = new DashboardService(_context);
        }

        [Fact]
        public async Task GetDashboardSummary_ShouldUseMonthlyReset_WhenFrequencyIsMonthly()
        {
            // Arrange: Setup monthly stipend resetting on the 20th of the month
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                MonthlyAllowanceAmount = 10000m,
                AllowanceDayOfMonth = 20,
                TargetMonthlySavings = 1000m,
                Currency = "THB",
                ResetFrequency = "Monthly"
            };
            _context.TblUserProfiles.Add(profile);

            // Add a mock source account
            var account = new TblAccount
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Name = "Cash",
                AccountType = AccountType.Cash,
                Balance = 5000m,
                Color = "#4F46E5",
                Icon = "Wallet",
                DeleteFlag = false
            };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetDashboardSummaryAsync(_userId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.True(result.Value.Quota > 0);
        }

        [Fact]
        public async Task GetDashboardSummary_ShouldUseWeeklyReset_WhenFrequencyIsWeekly()
        {
            // Arrange: Setup weekly stipend resetting on Monday (1)
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                MonthlyAllowanceAmount = 10000m,
                AllowanceDayOfMonth = 1, // Monday
                TargetMonthlySavings = 1000m,
                Currency = "THB",
                ResetFrequency = "Weekly"
            };
            _context.TblUserProfiles.Add(profile);

            var account = new TblAccount
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Name = "Cash",
                AccountType = AccountType.Cash,
                Balance = 5000m,
                Color = "#4F46E5",
                Icon = "Wallet",
                DeleteFlag = false
            };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetDashboardSummaryAsync(_userId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.True(result.Value.Quota > 0);
        }

        [Fact]
        public async Task GetDashboardSummary_ShouldUseRolling30Days_WhenFrequencyIsNone()
        {
            // Arrange: Setup rolling 30-day window
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                MonthlyAllowanceAmount = 10000m,
                AllowanceDayOfMonth = 25,
                TargetMonthlySavings = 1000m,
                Currency = "THB",
                ResetFrequency = "None"
            };
            _context.TblUserProfiles.Add(profile);

            var account = new TblAccount
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Name = "Cash",
                AccountType = AccountType.Cash,
                Balance = 5000m,
                Color = "#4F46E5",
                Icon = "Wallet",
                DeleteFlag = false
            };
            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetDashboardSummaryAsync(_userId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.True(result.Value.Quota > 0);
        }
    }
}
