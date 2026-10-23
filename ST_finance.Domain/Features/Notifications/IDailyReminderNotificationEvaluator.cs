namespace ST_finance.Domain.Features.Notifications;

public interface IDailyReminderNotificationEvaluator
{
    Task EvaluateAsync();
}
