using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;

namespace ST_finance.Domain.Features.Dashboard
{
    public class QuotaLoggingJob
    {
        private readonly AppDbContext _context;
        private readonly IDashboardService _dashboardService;

        public QuotaLoggingJob(AppDbContext context, IDashboardService dashboardService)
        {
            _context = context;
            _dashboardService = dashboardService;
        }

        public async Task LogDailyQuotasAsync()
        {
            var users = await _context.TblUsers
                .Where(u => !u.DeleteFlag)
                .ToListAsync();

            var yesterdayBkk = DateTime.UtcNow.AddHours(7).AddDays(-1);
            var logDate = DateOnly.FromDateTime(yesterdayBkk);

            var startOfYesterdayBkk = DateTime.SpecifyKind(
                new DateTime(yesterdayBkk.Year, yesterdayBkk.Month, yesterdayBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7),
                DateTimeKind.Utc);
            var endOfYesterdayBkk = startOfYesterdayBkk.AddDays(1);

            foreach (var user in users)
            {
                var summaryResult = await _dashboardService.GetDashboardSummaryAsync(user.Id);
                if (summaryResult.IsSuccess)
                {
                    var summary = summaryResult.Value;

                    var spentYesterday = await _context.TblTransactions
                        .Where(t => t.UserId == user.Id && t.TransactionType == "Expense" && t.Date >= startOfYesterdayBkk && t.Date < endOfYesterdayBkk)
                        .SumAsync(t => t.Amount);

                    var existingLog = await _context.TblDailyQuotaLogs
                        .FirstOrDefaultAsync(l => l.UserId == user.Id && l.Date == logDate);

                    if (existingLog == null)
                    {
                        var log = new TblDailyQuotaLog
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Date = logDate,
                            TargetQuota = summary.Quota,
                            ActualSpent = spentYesterday,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.TblDailyQuotaLogs.Add(log);
                    }
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
