namespace ST_finance.Domain.Features.Jobs;

public sealed record ScheduledJobCommand(string Job);

public static class ScheduledJobNames
{
    public const string ProcessRecurringSchedules = nameof(ProcessRecurringSchedules);
    public const string LogDailyQuotas = nameof(LogDailyQuotas);
    public const string ProcessDueNotifications = nameof(ProcessDueNotifications);
}
