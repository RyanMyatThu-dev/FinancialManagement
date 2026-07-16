using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts;
using ST_finance.Domain.Features.RecurringSchedules;
using ST_finance.Domain.Features.RecurringSchedules.Models;
using ST_finance.Domain.Features.Transactions;
using ST_finance.Shared.Enums;
using Xunit;

namespace ST_finance.UnitTests
{
    public class RecurringScheduleTests
    {
        private readonly AppDbContext _context;
        private readonly RecurringScheduleService _scheduleService;
        private readonly RecurringJobService _jobService;
        private readonly TransactionService _transactionService;
        private readonly Guid _userId = Guid.NewGuid();
        private Guid _accountId;

        public RecurringScheduleTests()
        {
            _context = TestDatabaseFixture.CreateContext();
            _scheduleService = new RecurringScheduleService(_context);
            var accountService = new AccountService(_context);
            _transactionService = new TransactionService(_context, accountService);
            _jobService = new RecurringJobService(_context, _transactionService);

            // Seed a source account
            var account = new TblAccount
            {
                UserId = _userId,
                Name = "Main Bank",
                AccountType = AccountType.Bank,
                Balance = 10000m,
                Color = "#4F46E5",
                Icon = "Wallet"
            };
            _context.TblAccounts.Add(account);
            _context.SaveChanges();
            _accountId = account.Id;
        }

        [Fact]
        public async Task CreateSchedule_ShouldAlignDatesToBkkMidnight_InUtc()
        {
            // If user selects 16 July 2026, it should store 15 July 2026 17:00:00 UTC
            var startDate = new DateTime(2026, 7, 16, 0, 0, 0, DateTimeKind.Utc);
            var request = new CreateRecurringScheduleRequest(
                AccountId: _accountId,
                TargetAccountId: null,
                CategoryId: null,
                Name: "Allowance",
                Amount: 1000m,
                TransactionType: "Income",
                Frequency: "Monthly",
                StartDate: startDate,
                EndDate: null
            );

            var result = await _scheduleService.CreateScheduleAsync(_userId, request);

            Assert.True(result.IsSuccess);
            var schedule = await _context.TblRecurringSchedules.FindAsync(result.Value.Id);
            Assert.NotNull(schedule);

            var expectedUtcStart = new DateTime(2026, 7, 15, 17, 0, 0, DateTimeKind.Utc);
            Assert.Equal(expectedUtcStart, schedule.StartDate);
            Assert.Equal(expectedUtcStart, schedule.NextOccurrenceDate);
        }

        [Theory]
        [InlineData("Daily", 1, 0)]
        [InlineData("Weekly", 7, 0)]
        [InlineData("Monthly", 0, 1)]
        [InlineData("BiMonthly", 0, 2)]
        [InlineData("BiAnnual", 0, 6)]
        [InlineData("Yearly", 0, 12)]
        public async Task ProcessRecurringSchedules_ShouldUpdateNextOccurrenceDateCorrectly(string frequency, int expectedDaysOffset, int expectedMonthsOffset)
        {
            // Seed a due schedule
            var initialNextOccurrence = DateTime.UtcNow.AddHours(-1); // due now
            var schedule = new TblRecurringSchedule
            {
                Id = Guid.NewGuid(),
                UserId = _userId,
                AccountId = _accountId,
                Name = $"Test Job {frequency}",
                Amount = 100m,
                TransactionType = "Income",
                Frequency = frequency,
                StartDate = initialNextOccurrence.AddDays(-10),
                NextOccurrenceDate = initialNextOccurrence,
                DeleteFlag = false
            };
            _context.TblRecurringSchedules.Add(schedule);
            await _context.SaveChangesAsync();

            // Run job
            await _jobService.ProcessRecurringSchedulesAsync();

            // Verify next occurrence is updated correctly
            var updated = await _context.TblRecurringSchedules.FindAsync(schedule.Id);
            Assert.NotNull(updated);

            DateTime expectedNextOccurrence;
            if (expectedMonthsOffset > 0)
            {
                expectedNextOccurrence = initialNextOccurrence.AddMonths(expectedMonthsOffset);
            }
            else
            {
                expectedNextOccurrence = initialNextOccurrence.AddDays(expectedDaysOffset);
            }

            Assert.Equal(expectedNextOccurrence, updated.NextOccurrenceDate);

            // Verify transaction created
            var tx = await _context.TblTransactions.FirstOrDefaultAsync(t => t.Description != null && t.Description.Contains(schedule.Name));
            Assert.NotNull(tx);
            Assert.Equal(100m, tx!.Amount);
        }
    }
}
