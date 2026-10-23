using System;

namespace ST_finance.Domain.Features.Jobs;

public interface INotificationSchedulingJob
{
    Task ProcessDueNotificationsAsync();

}
