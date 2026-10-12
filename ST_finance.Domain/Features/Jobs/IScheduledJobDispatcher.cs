namespace ST_finance.Domain.Features.Jobs;

public interface IScheduledJobDispatcher
{
    Task DispatchAsync(ScheduledJobCommand command);
}
