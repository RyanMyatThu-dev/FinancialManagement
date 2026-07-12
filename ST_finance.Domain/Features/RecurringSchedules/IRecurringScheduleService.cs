using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ST_finance.Domain.Features.RecurringSchedules.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.RecurringSchedules
{
    public interface IRecurringScheduleService
    {
        Task<Result<PagedResponse<RecurringScheduleResponse>>> GetSchedulesAsync(Guid userId, int pageNumber, int pageSize);
        Task<Result<RecurringScheduleResponse>> CreateScheduleAsync(Guid userId, CreateRecurringScheduleRequest request);
        Task<Result> DeleteScheduleAsync(Guid userId, Guid scheduleId);
    }
}
