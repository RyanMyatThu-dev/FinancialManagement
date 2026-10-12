using System;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Reports.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Reports
{
    public interface IReportService
    {
        Task<Result<ReportResponse>> SubmitReportAsync(Guid userId, SubmitReportRequest request);
    }
}
