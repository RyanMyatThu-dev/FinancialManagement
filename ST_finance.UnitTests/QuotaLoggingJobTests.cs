using Microsoft.EntityFrameworkCore;
using Moq;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Dashboard;
using ST_finance.Domain.Features.Dashboard.Models;
using ST_finance.Domain.Features.Jobs;
using ST_finance.Shared;

namespace ST_finance.UnitTests;

public sealed class QuotaLoggingJobTests
{
    [Fact]
    public async Task LogDailyQuotas_WhenRetried_DoesNotCreateDuplicateDailyRow()
    {
        await using var context = TestDatabaseFixture.CreateContext();
        var user = new TblUser
        {
            Id = Guid.NewGuid(),
            UserName = "quota-user",
            NormalizedUserName = "QUOTA-USER",
            Email = "quota@example.com",
            NormalizedEmail = "QUOTA@EXAMPLE.COM",
            DeleteFlag = false
        };
        context.TblUsers.Add(user);
        await context.SaveChangesAsync();

        var dashboard = new Mock<IDashboardService>();
        dashboard
            .Setup(service => service.GetDashboardSummaryAsync(user.Id, It.IsAny<string>()))
            .ReturnsAsync(Result.Success(new DashboardSummaryResponse(
                Quota: 250m,
                CanteenIndex: 0,
                TotalBalance: 0m,
                TotalSavings: 0m,
                DisposableBalance: 0m,
                MonthlyIncome: 0m,
                MonthlyExpense: 0m,
                SpentToday: 0m,
                ActiveWarnings: [],
                ResetDayText: string.Empty,
                EnableQuotaPacing: true)));

        var job = new QuotaLoggingJob(context, dashboard.Object);

        await job.LogDailyQuotasAsync();
        await job.LogDailyQuotasAsync();

        Assert.Equal(1, await context.TblDailyQuotaLogs.CountAsync(log => log.UserId == user.Id));
    }
}
