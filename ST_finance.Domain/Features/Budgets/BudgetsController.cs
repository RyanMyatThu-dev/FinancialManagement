using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Domain.Features.Budgets.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Budgets
{
    [Authorize]
    [Route("api/budgets")]
    public class BudgetsController : ApiControllerBase
    {
        private readonly IBudgetService _budgetService;

        public BudgetsController(IBudgetService budgetService)
        {
            _budgetService = budgetService;
        }

        [HttpGet]
        public async Task<IActionResult> GetBudgets([FromQuery] int? month, [FromQuery] int? year)
        {
            var nowBkk = DateTime.UtcNow.AddHours(7);
            int m = month ?? nowBkk.Month;
            int y = year ?? nowBkk.Year;

            var userId = GetUserId();
            var result = await _budgetService.GetBudgetsAsync(userId, m, y);
            return HandleResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> SetBudget([FromBody] CategoryBudgetRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<CategoryBudgetResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _budgetService.SetBudgetAsync(userId, request);
            return HandleResult(result);
        }
    }
}
