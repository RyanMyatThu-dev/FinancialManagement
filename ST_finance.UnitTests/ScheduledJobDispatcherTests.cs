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
        var dispatcher = new ScheduledJobDispatcher(
            recurringJob.Object,
            quotaJob.Object,
            NullLogger<ScheduledJobDispatcher>.Instance);

        await dispatcher.DispatchAsync(
            new ScheduledJobCommand(ScheduledJobNames.ProcessRecurringSchedules));

        recurringJob.Verify(service => service.ProcessRecurringSchedulesAsync(), Times.Once);
        quotaJob.Verify(service => service.LogDailyQuotasAsync(), Times.Never);
    }

    [Fact]
    public async Task DispatchAsync_LogDailyQuotas_InvokesQuotaService()
    {
        var recurringJob = new Mock<IRecurringJobService>();
        var quotaJob = new Mock<IQuotaLoggingJob>();
        var dispatcher = new ScheduledJobDispatcher(
            recurringJob.Object,
            quotaJob.Object,
            NullLogger<ScheduledJobDispatcher>.Instance);

        await dispatcher.DispatchAsync(
            new ScheduledJobCommand(ScheduledJobNames.LogDailyQuotas));

        recurringJob.Verify(service => service.ProcessRecurringSchedulesAsync(), Times.Never);
        quotaJob.Verify(service => service.LogDailyQuotasAsync(), Times.Once);
    }

    [Fact]
    public async Task DispatchAsync_UnknownCommand_Throws()
    {
        var dispatcher = new ScheduledJobDispatcher(
            Mock.Of<IRecurringJobService>(),
            Mock.Of<IQuotaLoggingJob>(),
            NullLogger<ScheduledJobDispatcher>.Instance);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            dispatcher.DispatchAsync(new ScheduledJobCommand("UnknownJob")));
    }
}
