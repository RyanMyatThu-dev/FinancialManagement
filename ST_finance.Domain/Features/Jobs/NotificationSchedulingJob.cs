using System;
using ST_finance.Domain.Features.Notifications;
namespace ST_finance.Domain.Features.Jobs;

public class NotificationSchedulingJob : INotificationSchedulingJob
{
    private readonly IDailyReminderNotificationEvaluator _dailyReminderNotificationEvaluator;
    private readonly IFunNotificationEvaluator _funNotificationEvaluator;
    public NotificationSchedulingJob(
        IDailyReminderNotificationEvaluator dailyReminderNotificationEvaluator,
        IFunNotificationEvaluator funNotificationEvaluator)
    {
        _dailyReminderNotificationEvaluator = dailyReminderNotificationEvaluator;
        _funNotificationEvaluator = funNotificationEvaluator;
    }
    public async Task ProcessDueNotificationsAsync()
    {
        await _dailyReminderNotificationEvaluator.EvaluateAsync();
        await _funNotificationEvaluator.EvaluateAsync();

    }
}
