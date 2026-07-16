using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.RecurringSchedules.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.RecurringSchedules
{
    public class RecurringScheduleService : IRecurringScheduleService
    {
        private readonly AppDbContext _context;

        public RecurringScheduleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<PagedResponse<RecurringScheduleResponse>>> GetSchedulesAsync(Guid userId, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize  < 1) pageSize  = 20;
            if (pageSize  > 100) pageSize = 100;

            var query = _context.TblRecurringSchedules
                .Where(s => s.UserId == userId)
                .OrderBy(s => s.NextOccurrenceDate);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var responses = items.Select(MapToResponse).ToList();
            return Result.Success(PagedResponse<RecurringScheduleResponse>.Create(responses, totalCount, pageNumber, pageSize));
        }

        public async Task<Result<RecurringScheduleResponse>> CreateScheduleAsync(Guid userId, CreateRecurringScheduleRequest request)
        {
            if (request == null)
            {
                return Result.Failure<RecurringScheduleResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }
            if (request.Amount < 0)
            {
                return Result.Failure<RecurringScheduleResponse>(CustomErrors.Transaction.NegativeAmount);
            }

           
            var sourceExists = await _context.TblAccounts.AnyAsync(a => a.Id == request.AccountId && a.UserId == userId);
            if (!sourceExists)
            {
                return Result.Failure<RecurringScheduleResponse>(CustomErrors.Account.NotFound);
            }

           
            if (request.TransactionType == "Transfer")
            {
                if (request.TargetAccountId == null)
                {
                    return Result.Failure<RecurringScheduleResponse>(CustomErrors.Transaction.MissingTargetAccount);
                }
                if (request.AccountId == request.TargetAccountId)
                {
                    return Result.Failure<RecurringScheduleResponse>(CustomErrors.Transaction.SameAccounts);
                }

                var targetExists = await _context.TblAccounts.AnyAsync(a => a.Id == request.TargetAccountId.Value && a.UserId == userId);
                if (!targetExists)
                {
                    return Result.Failure<RecurringScheduleResponse>(new Error("Account.TargetNotFound", "Target account not found."));
                }
            }

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.TblCategories.AnyAsync(c => c.Id == request.CategoryId.Value && c.UserId == userId);
                if (!categoryExists)
                {
                    return Result.Failure<RecurringScheduleResponse>(CustomErrors.Validation.InvalidInput("Invalid category selected."));
                }
            }

            // Align StartDate and EndDate to BKK timezone (UTC+7) start/end of day, then convert to UTC
            var bkkStart = new DateTime(request.StartDate.Year, request.StartDate.Month, request.StartDate.Day, 0, 0, 0, DateTimeKind.Utc);
            var utcStart = bkkStart.AddHours(-7);

            DateTime? utcEnd = null;
            if (request.EndDate.HasValue)
            {
                var bkkEnd = new DateTime(request.EndDate.Value.Year, request.EndDate.Value.Month, request.EndDate.Value.Day, 23, 59, 59, DateTimeKind.Utc).AddMilliseconds(999);
                utcEnd = bkkEnd.AddHours(-7);
            }

            var schedule = new TblRecurringSchedule
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AccountId = request.AccountId,
                TargetAccountId = request.TargetAccountId,
                CategoryId = request.CategoryId,
                Name = request.Name,
                Amount = request.Amount,
                TransactionType = request.TransactionType,
                Frequency = request.Frequency,
                StartDate = utcStart,
                EndDate = utcEnd,
                NextOccurrenceDate = utcStart, // Initial occurrence is start date
                LastTriggeredAt = null,
                DeleteFlag = false
            };

            _context.TblRecurringSchedules.Add(schedule);
            await _context.SaveChangesAsync();

            return Result.Success(MapToResponse(schedule));
        }

        public async Task<Result> DeleteScheduleAsync(Guid userId, Guid scheduleId)
        {
            var schedule = await _context.TblRecurringSchedules
                .FirstOrDefaultAsync(s => s.Id == scheduleId && s.UserId == userId);

            if (schedule == null)
            {
                return Result.Failure(new Error("RecurringSchedule.NotFound", "Recurring schedule not found."));
            }

            // Soft delete
            schedule.DeleteFlag = true;
            await _context.SaveChangesAsync();

            return Result.Success();
        }

        private static RecurringScheduleResponse MapToResponse(TblRecurringSchedule schedule)
        {
            return new RecurringScheduleResponse(
                Id: schedule.Id,
                UserId: schedule.UserId,
                AccountId: schedule.AccountId,
                TargetAccountId: schedule.TargetAccountId,
                CategoryId: schedule.CategoryId,
                Name: schedule.Name,
                Amount: schedule.Amount,
                TransactionType: schedule.TransactionType,
                Frequency: schedule.Frequency,
                StartDate: schedule.StartDate,
                EndDate: schedule.EndDate,
                LastTriggeredAt: schedule.LastTriggeredAt,
                NextOccurrenceDate: schedule.NextOccurrenceDate,
                CreatedAt: DateTime.UtcNow
            );
        }
    }
}
