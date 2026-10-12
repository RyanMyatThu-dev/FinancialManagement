using Microsoft.Extensions.Logging;

namespace ST_finance.Domain.Features.Jobs;

public sealed class ScheduledJobDispatcher : IScheduledJobDispatcher
{
    private readonly IRecurringJobService _recurringJobService;
    private readonly IQuotaLoggingJob _quotaLoggingJob;
    private readonly ILogger<ScheduledJobDispatcher> _logger;

    public ScheduledJobDispatcher(
        IRecurringJobService recurringJobService,
        IQuotaLoggingJob quotaLoggingJob,
        ILogger<ScheduledJobDispatcher> logger)
    {
        _recurringJobService = recurringJobService;
        _quotaLoggingJob = quotaLoggingJob;
        _logger = logger;
    }

    public async Task DispatchAsync(ScheduledJobCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);

        _logger.LogInformation("Starting scheduled job {JobName}", command.Job);

        switch (command.Job)
        {
            case ScheduledJobNames.ProcessRecurringSchedules:
                await _recurringJobService.ProcessRecurringSchedulesAsync();
                break;
            case ScheduledJobNames.LogDailyQuotas:
                await _quotaLoggingJob.LogDailyQuotasAsync();
                break;
            default:
                throw new ArgumentOutOfRangeException(
                    nameof(command),
                    command.Job,
                    "Unknown scheduled job command.");
        }

        _logger.LogInformation("Completed scheduled job {JobName}", command.Job);
    }
}
