using System;
using System.ComponentModel.DataAnnotations;

namespace ST_finance.Domain.Features.Budgets.Models
{
    public record CategoryBudgetRequest(
        [Required] Guid CategoryId,
        [Required] decimal LimitAmount,
        [Required][Range(1, 12)] int Month,
        [Required] int Year
    );

    public record CategoryBudgetResponse(
        Guid Id,
        Guid CategoryId,
        string CategoryName,
        decimal LimitAmount,
        decimal AmountSpent,
        int Month,
        int Year
    );
}
