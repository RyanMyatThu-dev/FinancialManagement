using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Domain.Features.Accounts.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Accounts
{
    [Authorize]
    [Route("api/[controller]")]
    public class AccountsController : ApiControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountsController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAccounts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize   = 20)
        {
            var userId = GetUserId();
            var result = await _accountService.GetAccountsAsync(userId, pageNumber, pageSize);
            return HandleResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request)
        {
            // Controller-level Model validation
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<AccountResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _accountService.CreateAccountAsync(userId, request);
            return HandleResult(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccount(Guid id, [FromBody] UpdateAccountRequest request)
        {
            // Controller-level Model validation
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<AccountResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _accountService.UpdateAccountAsync(userId, id, request);
            return HandleResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(Guid id, [FromQuery] bool force = false)
        {
            var userId = GetUserId();
            var result = await _accountService.DeleteAccountAsync(userId, id, force);
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
