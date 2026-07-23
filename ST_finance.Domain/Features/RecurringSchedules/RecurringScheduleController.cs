using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Domain.Features.RecurringSchedules.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.RecurringSchedules
{
    [Authorize]
    [Route("api/recurring")]
    public class RecurringScheduleController : ApiControllerBase
    {
        private readonly IRecurringScheduleService _recurringScheduleService;

        public RecurringScheduleController(IRecurringScheduleService recurringScheduleService)
        {
            _recurringScheduleService = recurringScheduleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetSchedules(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = GetUserId();
            var result = await _recurringScheduleService.GetSchedulesAsync(userId, pageNumber, pageSize);
            return HandleResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSchedule([FromBody] CreateRecurringScheduleRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<RecurringScheduleResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _recurringScheduleService.CreateScheduleAsync(userId, request);
            return HandleResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchedule(Guid id)
        {
            var userId = GetUserId();
            var result = await _recurringScheduleService.DeleteScheduleAsync(userId, id);
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
