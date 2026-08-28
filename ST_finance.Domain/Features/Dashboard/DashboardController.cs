using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Dashboard
{
    [Authorize]
    [Route("api/dashboard")]
    public class DashboardController : ApiControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] string timeframe = "Month")
        {
            var userId = GetUserId();
            var result = await _dashboardService.GetDashboardSummaryAsync(userId, timeframe);
            return HandleResult(result);
        }

        [HttpGet("trends")]
        public async Task<IActionResult> GetTrends()
        {
            var userId = GetUserId();
            var result = await _dashboardService.GetDailyQuotaLogsAsync(userId);
            return HandleResult(result);
        }
    }
}
