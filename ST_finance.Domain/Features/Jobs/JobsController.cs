using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using ST_finance.Domain.Features.Dashboard;
using ST_finance.Domain.Features.RecurringSchedules;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Jobs
{
    /// <summary>
    /// Internal job endpoints triggered by Amazon EventBridge Scheduler.
    /// Secured with an API key header to prevent unauthorized access.
    /// These endpoints replace Hangfire's polling mechanism for serverless environments.
    /// </summary>
    [Route("api/[controller]")]
    public class JobsController : ApiControllerBase
    {
        private readonly RecurringJobService _recurringJobService;
        private readonly QuotaLoggingJob _quotaLoggingJob;
        private readonly IConfiguration _configuration;

        public JobsController(
            RecurringJobService recurringJobService,
            QuotaLoggingJob quotaLoggingJob,
            IConfiguration configuration)
        {
            _recurringJobService = recurringJobService;
            _quotaLoggingJob = quotaLoggingJob;
            _configuration = configuration;
        }

        /// <summary>
        /// Processes all due recurring schedules (rent, allowances, subscriptions).
        /// Triggered hourly by Amazon EventBridge Scheduler.
        /// </summary>
        [HttpPost("process-recurring")]
        public async Task<IActionResult> ProcessRecurring()
        {
            if (!IsAuthorizedScheduler())
            {
                return Unauthorized(Result.Failure(new Error("Jobs.Unauthorized", "Invalid or missing scheduler API key.")));
            }

            await _recurringJobService.ProcessRecurringSchedulesAsync();
            return HandleResult(Result.Success());
        }

        /// <summary>
        /// Logs the daily quota snapshots for all users.
        /// Triggered once daily at midnight (BKK time) by Amazon EventBridge Scheduler.
        /// </summary>
        [HttpPost("log-daily-quotas")]
        public async Task<IActionResult> LogDailyQuotas()
        {
            if (!IsAuthorizedScheduler())
            {
                return Unauthorized(Result.Failure(new Error("Jobs.Unauthorized", "Invalid or missing scheduler API key.")));
            }

            await _quotaLoggingJob.LogDailyQuotasAsync();
            return HandleResult(Result.Success());
        }

        /// <summary>
        /// Validates the x-scheduler-api-key header against the stored environment variable.
        /// </summary>
        private bool IsAuthorizedScheduler()
        {
            var expectedKey = _configuration["SchedulerApiKey"];
            if (string.IsNullOrEmpty(expectedKey)) return false;

            var providedKey = Request.Headers["x-scheduler-api-key"].FirstOrDefault();
            return string.Equals(providedKey, expectedKey, StringComparison.Ordinal);
        }
    }
}
