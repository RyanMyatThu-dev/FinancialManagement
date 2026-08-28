using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Transactions;
using ST_finance.Domain.Features.Transactions.Models;

namespace ST_finance.Domain.Features.Jobs
{
    public class RecurringJobService : IRecurringJobService
    {
        private readonly AppDbContext _context;
        private readonly ITransactionService _transactionService;
        private readonly ILogger<RecurringJobService> _logger;

        public RecurringJobService(AppDbContext context, ITransactionService transactionService, ILogger<RecurringJobService> logger)
        {
            _context = context;
            _transactionService = transactionService;
            _logger = logger;
        }

        public async Task ProcessRecurringSchedulesAsync()
        {
            var now = DateTime.UtcNow;

            var dueSchedules = await _context.TblRecurringSchedules
                .Where(s => s.NextOccurrenceDate <= now && (s.EndDate == null || s.EndDate >= now))
                .ToListAsync();

            foreach (var schedule in dueSchedules)
            {
                var request = new TransactionRequest
                {
                    AccountId = schedule.AccountId,
                    TargetAccountId = schedule.TargetAccountId,
                    CategoryId = schedule.CategoryId,
                    TransactionType = schedule.TransactionType,
                    IsRecurring = true,
                    Date = now,
                    Amount = schedule.Amount,
                    Description = $"[Recurring] {schedule.Name}",
                    TagIds = null
                };

                var result = await _transactionService.CreateTransactionAsync(schedule.UserId, request);
                if (result.IsSuccess)
                {
                    schedule.LastTriggeredAt = now;
                    schedule.NextOccurrenceDate = CalculateNextOccurrence(schedule.NextOccurrenceDate, schedule.Frequency);
                }
                else
                {
                    _logger.LogError("Failed to process recurring schedule '{ScheduleName}' (ID: {ScheduleId}): {ErrorMessage}",
                        schedule.Name, schedule.Id, result.Error.Message);
                }
            }

            await _context.SaveChangesAsync();
        }

        private static DateTime CalculateNextOccurrence(DateTime current, string frequency)
        {
            return frequency switch
            {
                "Daily" => current.AddDays(1),
                "Weekly" => current.AddDays(7),
                "Monthly" => current.AddMonths(1),
                "BiMonthly" => current.AddMonths(2),
                "BiAnnual" => current.AddMonths(6),
                "Yearly" => current.AddYears(1),
                _ => current.AddDays(1)
            };
        }
    }
}
