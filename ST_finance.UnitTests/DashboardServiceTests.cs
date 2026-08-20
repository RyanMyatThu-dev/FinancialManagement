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
        public async Task GetDashboardSummary_ShouldUseIncomeScheduleReset_WhenPacingIsEnabledAndIncomeExists()
        {
            // Arrange: Setup user profile with pacing active
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                TargetMonthlySavings = 1000m,
                Currency = "THB",
                EnableQuotaPacing = true
            };
            _context.TblUserProfiles.Add(profile);

            // Add source account
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

            // Add a recurring income schedule (e.g., next occurrence in 10 days)
            var schedule = new TblRecurringSchedule
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Name = "Monthly Pocket Money",
                Amount = 15000m,
                Frequency = "Monthly",
                TransactionType = "Income",
                StartDate = DateTime.UtcNow.AddHours(7).Date.AddHours(-7),
                NextOccurrenceDate = DateTime.UtcNow.AddHours(7).Date.AddDays(10).AddHours(-7),
                DeleteFlag = false,
                AccountId = account.Id
            };
            _context.TblRecurringSchedules.Add(schedule);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetDashboardSummaryAsync(_userId);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.True(result.Value.EnableQuotaPacing);
            Assert.Contains("from Monthly Pocket Money", result.Value.ResetDayText);
            Assert.Equal(10, result.Value.DaysRemaining);
            // Quota should be disposable balance (5000) divided by 10 days = 500 THB
            Assert.Equal(500m, result.Value.Quota);
        }

        [Fact]
        public async Task GetDashboardSummary_ShouldUseProfileAllowanceReset_WhenPacingIsEnabledAndProfileConfigured()
        {
            // Arrange: Setup user profile with allowance day configured (e.g. 25th of month)
            var currentBkk = DateTime.UtcNow.AddHours(7);
            var nextMonthReset = currentBkk.Day >= 25
                ? new DateTime(currentBkk.Year, currentBkk.Month, 25, 0, 0, 0, DateTimeKind.Utc).AddMonths(1)
                : new DateTime(currentBkk.Year, currentBkk.Month, 25, 0, 0, 0, DateTimeKind.Utc);
            var expectedDays = Math.Max(1, (nextMonthReset.Date - currentBkk.Date).Days);

            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                TargetMonthlySavings = 0m,
                Currency = "THB",
                EnableQuotaPacing = true,
                ResetFrequency = "Monthly",
                AllowanceDayOfMonth = 25
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
            Assert.True(result.Value.EnableQuotaPacing);
            Assert.Equal("25th of Month (from Profile)", result.Value.ResetDayText);
            Assert.Equal(expectedDays, result.Value.DaysRemaining);
            Assert.Equal(5000m / expectedDays, result.Value.Quota);
        }

        [Fact]
        public async Task GetDashboardSummary_ShouldUseCalendarMonthFallback_WhenNoIncomeOrProfileConfigured()
        {
            // Arrange: Setup user profile with pacing active but no recurring income or custom allowance day
            var currentBkk = DateTime.UtcNow.AddHours(7);
            var nextMonth1st = new DateTime(currentBkk.Year, currentBkk.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(1);
            var expectedDays = Math.Max(1, (nextMonth1st.Date - currentBkk.Date).Days);

            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                TargetMonthlySavings = 0m,
                Currency = "THB",
                EnableQuotaPacing = true,
                ResetFrequency = "None",
                AllowanceDayOfMonth = null
            };
            _context.TblUserProfiles.Add(profile);

            var account = new TblAccount
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                Name = "Cash",
                AccountType = AccountType.Cash,
                Balance = 3000m,
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
            Assert.True(result.Value.EnableQuotaPacing);
            Assert.Equal("1st of Month (Calendar Cycle)", result.Value.ResetDayText);
            Assert.Equal(expectedDays, result.Value.DaysRemaining);
            Assert.Equal(3000m / expectedDays, result.Value.Quota);
        }

        [Fact]
        public async Task GetDashboardSummary_ShouldDisablePacing_WhenPacingIsDisabled()
        {
            // Arrange: Setup user profile with pacing disabled
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                TargetMonthlySavings = 1000m,
                Currency = "THB",
                EnableQuotaPacing = false
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
            Assert.False(result.Value.EnableQuotaPacing);
            Assert.Equal(0m, result.Value.Quota);
            Assert.Equal(0, result.Value.CanteenIndex);
        }
    }
}
