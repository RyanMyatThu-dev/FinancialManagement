using System;
using System.Threading.Tasks;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Reports.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Reports
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<ReportResponse>> SubmitReportAsync(Guid userId, SubmitReportRequest request)
        {
            if (request == null)
            {
                return Result.Failure<ReportResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var report = new TblUserReport
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                Status = "Open",
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblUserReports.Add(report);
            await _context.SaveChangesAsync();

            return Result.Success(new ReportResponse(report.Id, report.Title, report.Description, report.Status, report.CreatedAt));
        }
    }
}
