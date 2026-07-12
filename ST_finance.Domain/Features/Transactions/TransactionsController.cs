using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Domain.Features.Transactions.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Transactions
{
    [Authorize]
    [Route("api/[controller]")]
    public class TransactionsController : ApiControllerBase
    {
        private readonly ITransactionService _transactionService;

        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize   = 20,
            [FromQuery] Guid? categoryId = null,
            [FromQuery] Guid? tagId      = null,
            [FromQuery] decimal? minAmount = null,
            [FromQuery] decimal? maxAmount = null,
            [FromQuery] string? search     = null)
        {
            var userId = GetUserId();
            var result = await _transactionService.GetTransactionsAsync(
                userId, pageNumber, pageSize, categoryId, tagId, minAmount, maxAmount, search
            );
            return HandleResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTransaction([FromBody] TransactionRequest request)
        {
            // Controller-level Model validation
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<TransactionResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _transactionService.CreateTransactionAsync(userId, request);
            return HandleResult(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] TransactionRequest request)
        {
            // Controller-level Model validation
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<TransactionResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _transactionService.UpdateTransactionAsync(userId, id, request);
            return HandleResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            var userId = GetUserId();
            var result = await _transactionService.DeleteTransactionAsync(userId, id);
            return HandleResult(result);
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var userId = GetUserId();
            var result = await _transactionService.GetCategoriesAsync(userId);
            return HandleResult(result);
        }

        [HttpGet("tags")]
        public async Task<IActionResult> GetTags()
        {
            var userId = GetUserId();
            var result = await _transactionService.GetTagsAsync(userId);
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
