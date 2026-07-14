using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Domain.Features.SavingsGoals.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.SavingsGoals
{
    [Authorize]
    [Route("api/savings-goals")]
    public class SavingsGoalsController : ApiControllerBase
    {
        private readonly ISavingsGoalService _savingsGoalService;

        public SavingsGoalsController(ISavingsGoalService savingsGoalService)
        {
            _savingsGoalService = savingsGoalService;
        }

        [HttpGet]
        public async Task<IActionResult> GetGoals(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize   = 12)
        {
            var userId = GetUserId();
            var result = await _savingsGoalService.GetGoalsAsync(userId, pageNumber, pageSize);
            return HandleResult(result);
        }

        [HttpGet("completed")]
        public async Task<IActionResult> GetCompletedGoals(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize   = 12,
            [FromQuery] string sortBy = "CompletedAt")
        {
            var userId = GetUserId();
            var result = await _savingsGoalService.GetCompletedGoalsAsync(userId, pageNumber, pageSize, sortBy);
            return HandleResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateGoal([FromBody] CreateSavingsGoalRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<SavingsGoalResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _savingsGoalService.CreateGoalAsync(userId, request);
            return HandleResult(result);
        }

        [HttpPost("{id}/contribute")]
        public async Task<IActionResult> ContributeToGoal(Guid id, [FromBody] ContributeRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<SavingsGoalResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _savingsGoalService.ContributeToGoalAsync(userId, id, request);
            return HandleResult(result);
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteGoal(Guid id)
        {
            var userId = GetUserId();
            var result = await _savingsGoalService.CompleteGoalAsync(userId, id);
            return HandleResult(result);
        }

        [HttpGet("{id}/contributions")]
        public async Task<IActionResult> GetContributions(Guid id)
        {
            var userId = GetUserId();
            var result = await _savingsGoalService.GetContributionsAsync(userId, id);
            return HandleResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(Guid id)
        {
            var userId = GetUserId();
            var result = await _savingsGoalService.DeleteGoalAsync(userId, id);
            return HandleResult(result);
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                throw new UnauthorizedAccessException("User ID claim missing or invalid in JWT token.");
            }
            return userId;
        }
    }
}
