using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Budgets.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Budgets
{
    public interface IBudgetService
    {
        Task<Result<IEnumerable<CategoryBudgetResponse>>> GetBudgetsAsync(Guid userId, int month, int year);
        Task<Result<CategoryBudgetResponse>> SetBudgetAsync(Guid userId, CategoryBudgetRequest request);
    }
}
