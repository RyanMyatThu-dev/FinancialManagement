using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Dashboard.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Dashboard
{
    public interface IDashboardService
    {
        Task<Result<DashboardSummaryResponse>> GetDashboardSummaryAsync(Guid userId);
        Task<Result<IEnumerable<DailyQuotaLogResponse>>> GetDailyQuotaLogsAsync(Guid userId);
    }
}
