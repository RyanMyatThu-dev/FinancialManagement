using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using ST_finance.Domain.Features.Jobs;

namespace ST_finance.UnitTests;

public sealed class ScheduledJobDispatcherTests
{
    [Fact]
    public async Task DispatchAsync_ProcessRecurringSchedules_InvokesRecurringService()
    {
        var recurringJob = new Mock<IRecurringJobService>();
        var quotaJob = new Mock<IQuotaLoggingJob>();
        var notificationJob = new Mock<INotificationSchedulingJob>();
        var dispatcher = new ScheduledJobDispatcher(
            recurringJob.Object,
            quotaJob.Object,
            NullLogger<ScheduledJobDispatcher>.Instance,
            notificationJob.Object);

        await dispatcher.DispatchAsync(
            new ScheduledJobCommand(ScheduledJobNames.ProcessRecurringSchedules));

        recurringJob.Verify(service => service.ProcessRecurringSchedulesAsync(), Times.Once);
        quotaJob.Verify(service => service.LogDailyQuotasAsync(), Times.Never);
        notificationJob.Verify(service => service.ProcessDueNotificationsAsync(), Times.Never);
    }

    [Fact]
    public async Task DispatchAsync_LogDailyQuotas_InvokesQuotaService()
    {
        var recurringJob = new Mock<IRecurringJobService>();
        var quotaJob = new Mock<IQuotaLoggingJob>();
        var notificationJob = new Mock<INotificationSchedulingJob>();
        var dispatcher = new ScheduledJobDispatcher(
            recurringJob.Object,
            quotaJob.Object,
            NullLogger<ScheduledJobDispatcher>.Instance,
            notificationJob.Object);

        await dispatcher.DispatchAsync(
            new ScheduledJobCommand(ScheduledJobNames.LogDailyQuotas));

        recurringJob.Verify(service => service.ProcessRecurringSchedulesAsync(), Times.Never);
        quotaJob.Verify(service => service.LogDailyQuotasAsync(), Times.Once);
        notificationJob.Verify(service => service.ProcessDueNotificationsAsync(), Times.Never);
    }

    [Fact]
    public async Task DispatchAsync_ProcessDueNotifications_InvokesNotificationService()
    {
        var recurringJob = new Mock<IRecurringJobService>();
        var quotaJob = new Mock<IQuotaLoggingJob>();
        var notificationJob = new Mock<INotificationSchedulingJob>();
        var dispatcher = new ScheduledJobDispatcher(
            recurringJob.Object,
            quotaJob.Object,
            NullLogger<ScheduledJobDispatcher>.Instance,
            notificationJob.Object);

        await dispatcher.DispatchAsync(
            new ScheduledJobCommand(ScheduledJobNames.ProcessDueNotifications));

        recurringJob.Verify(service => service.ProcessRecurringSchedulesAsync(), Times.Never);
        quotaJob.Verify(service => service.LogDailyQuotasAsync(), Times.Never);
        notificationJob.Verify(service => service.ProcessDueNotificationsAsync(), Times.Once);
    }

    [Fact]
    public async Task DispatchAsync_UnknownCommand_Throws()
    {
        var dispatcher = new ScheduledJobDispatcher(
            Mock.Of<IRecurringJobService>(),
            Mock.Of<IQuotaLoggingJob>(),
            NullLogger<ScheduledJobDispatcher>.Instance,
            Mock.Of<INotificationSchedulingJob>());

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            dispatcher.DispatchAsync(new ScheduledJobCommand("UnknownJob")));
    }
}
