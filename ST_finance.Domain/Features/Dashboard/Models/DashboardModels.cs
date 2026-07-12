using System;
using System.Collections.Generic;

namespace ST_finance.Domain.Features.Dashboard.Models
{
    public record DashboardSummaryResponse(
        decimal Quota,
        int CanteenIndex,
        decimal TotalBalance,
        decimal TotalSavings,
        decimal DisposableBalance,
        decimal MonthlyIncome,
        decimal MonthlyExpense,
        List<string> ActiveWarnings
    );

    public record DailyQuotaLogResponse(
        DateOnly Date,
        decimal TargetQuota,
        decimal ActualSpent
    );
}
