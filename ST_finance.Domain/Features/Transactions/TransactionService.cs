using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts;
using ST_finance.Domain.Features.Transactions.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Transactions
{
    public class TransactionService : ITransactionService
    {
        private readonly AppDbContext _context;
        private readonly IAccountService _accountService;

        public TransactionService(AppDbContext context, IAccountService accountService)
        {
            _context = context;
            _accountService = accountService;
        }

        public async Task<Result<PagedResponse<TransactionResponse>>> GetTransactionsAsync(
            Guid userId,
            int pageNumber,
            int pageSize,
            Guid? categoryId = null,
            Guid? tagId = null,
            decimal? minAmount = null,
            decimal? maxAmount = null,
            string? search = null,
            string? timeframe = null
        )
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize  < 1) pageSize  = 20;
            if (pageSize  > 100) pageSize = 100;

            var query = _context.TblTransactions
                .Include(t => t.Tags)
                .Where(t => t.UserId == userId);

            if (!string.IsNullOrWhiteSpace(timeframe))
            {
                var nowUtc = DateTime.UtcNow;
                var currentBkk = nowUtc.AddHours(7);
                DateTime startDate = DateTime.MinValue;
                DateTime endDate = DateTime.MaxValue;

                if (timeframe.Equals("Day", StringComparison.OrdinalIgnoreCase))
                {
                    startDate = DateTime.SpecifyKind(new DateTime(currentBkk.Year, currentBkk.Month, currentBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                    endDate = startDate.AddDays(1);
                }
                else if (timeframe.Equals("Week", StringComparison.OrdinalIgnoreCase))
                {
                    int diff = (7 + (currentBkk.DayOfWeek - DayOfWeek.Monday)) % 7;
                    var startOfWeekBkk = currentBkk.AddDays(-1 * diff);
                    startDate = DateTime.SpecifyKind(new DateTime(startOfWeekBkk.Year, startOfWeekBkk.Month, startOfWeekBkk.Day, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                    endDate = startDate.AddDays(7);
                }
                else if (timeframe.Equals("Month", StringComparison.OrdinalIgnoreCase))
                {
                    startDate = DateTime.SpecifyKind(new DateTime(currentBkk.Year, currentBkk.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                    endDate = startDate.AddMonths(1);
                }
                else if (timeframe.Equals("Year", StringComparison.OrdinalIgnoreCase))
                {
                    startDate = DateTime.SpecifyKind(new DateTime(currentBkk.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-7), DateTimeKind.Utc);
                    endDate = startDate.AddYears(1);
                }

                if (startDate != DateTime.MinValue)
                {
                    query = query.Where(t => t.Date >= startDate && t.Date < endDate);
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(t => t.Description != null && t.Description.ToLower().Contains(search.ToLower()));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(t => t.CategoryId == categoryId.Value);
            }

            if (tagId.HasValue)
            {
                query = query.Where(t => t.Tags.Any(tag => tag.Id == tagId.Value));
            }

            if (minAmount.HasValue)
            {
                query = query.Where(t => t.Amount >= minAmount.Value);
            }

            if (maxAmount.HasValue)
            {
                query = query.Where(t => t.Amount <= maxAmount.Value);
            }

            query = query.OrderByDescending(t => t.Date);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var responses = items.Select(MapToResponse).ToList();
            return Result.Success(PagedResponse<TransactionResponse>.Create(responses, totalCount, pageNumber, pageSize));
        }

        public async Task<Result<TransactionResponse>> CreateTransactionAsync(Guid userId, TransactionRequest request)
        {
            if (request == null)
            {
                return Result.Failure<TransactionResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }
            if (request.TransactionType != "Income" && request.TransactionType != "Expense" && request.TransactionType != "Transfer")
            {
                return Result.Failure<TransactionResponse>(CustomErrors.Transaction.InvalidType);
            }
            if (request.Amount < 0)
            {
                return Result.Failure<TransactionResponse>(CustomErrors.Transaction.NegativeAmount);
            }

            // Validate Category if provided
            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.TblCategories
                    .AnyAsync(c => c.Id == request.CategoryId.Value && c.UserId == userId);
                if (!categoryExists)
                {
                    return Result.Failure<TransactionResponse>(CustomErrors.Validation.InvalidInput("Invalid category selected."));
                }
            }

            // Validate and fetch Tags if provided
            var tags = new List<TblTag>();
            if (request.TagIds != null && request.TagIds.Any())
            {
                tags = await _context.TblTags
                    .Where(t => request.TagIds.Contains(t.Id) && t.UserId == userId)
                    .ToListAsync();
            }

            using var transactionScope = await _context.Database.BeginTransactionAsync();
            try
            {
                // Adjust account balances and capture error if any
                var balanceResult = await AdjustAccountBalancesAsync(userId, request.TransactionType, request.AccountId, request.TargetAccountId, request.Amount, isRevert: false);
                if (balanceResult.IsFailure)
                {
                    await transactionScope.RollbackAsync();
                    return Result.Failure<TransactionResponse>(balanceResult.Error);
                }

                var transaction = new TblTransaction
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AccountId = request.AccountId,
                    TargetAccountId = request.TargetAccountId,
                    CategoryId = request.CategoryId,
                    TransactionType = request.TransactionType,
                    IsRecurringCreated = request.IsRecurring,
                    Date = request.Date,
                    Amount = request.Amount,
                    Description = request.Description,
                    CreatedAt = DateTime.UtcNow,
                    DeleteFlag = false,
                    Tags = tags
                };

                _context.TblTransactions.Add(transaction);
                await _context.SaveChangesAsync();

                await transactionScope.CommitAsync();

                return Result.Success(MapToResponse(transaction));
            }
            catch
            {
                await transactionScope.RollbackAsync();
                throw;
            }
        }

        public async Task<Result<TransactionResponse>> UpdateTransactionAsync(Guid userId, Guid transactionId, TransactionRequest request)
        {
            if (request == null)
            {
                return Result.Failure<TransactionResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }
            if (request.TransactionType != "Income" && request.TransactionType != "Expense" && request.TransactionType != "Transfer")
            {
                return Result.Failure<TransactionResponse>(CustomErrors.Transaction.InvalidType);
            }
            if (request.Amount < 0)
            {
                return Result.Failure<TransactionResponse>(CustomErrors.Transaction.NegativeAmount);
            }

            var existingTx = await _context.TblTransactions
                .Include(t => t.Tags)
                .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

            if (existingTx == null)
            {
                return Result.Failure<TransactionResponse>(CustomErrors.Transaction.NotFound);
            }

            // Validate Category if provided
            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.TblCategories
                    .AnyAsync(c => c.Id == request.CategoryId.Value && c.UserId == userId);
                if (!categoryExists)
                {
                    return Result.Failure<TransactionResponse>(CustomErrors.Validation.InvalidInput("Invalid category selected."));
                }
            }

            using var transactionScope = await _context.Database.BeginTransactionAsync();
            try
            {
                // Revert old balance changes
                var revertResult = await AdjustAccountBalancesAsync(userId, existingTx.TransactionType, existingTx.AccountId, existingTx.TargetAccountId, existingTx.Amount, isRevert: true);
                if (revertResult.IsFailure)
                {
                    await transactionScope.RollbackAsync();
                    return Result.Failure<TransactionResponse>(revertResult.Error);
                }

                // Apply new balance changes
                var applyResult = await AdjustAccountBalancesAsync(userId, request.TransactionType, request.AccountId, request.TargetAccountId, request.Amount, isRevert: false);
                if (applyResult.IsFailure)
                {
                    await transactionScope.RollbackAsync();
                    return Result.Failure<TransactionResponse>(applyResult.Error);
                }

                // Update properties
                existingTx.AccountId = request.AccountId;
                existingTx.TargetAccountId = request.TargetAccountId;
                existingTx.CategoryId = request.CategoryId;
                existingTx.TransactionType = request.TransactionType;
                existingTx.IsRecurringCreated = request.IsRecurring;
                existingTx.Date = request.Date;
                existingTx.Amount = request.Amount;
                existingTx.Description = request.Description;

                // Sync tags
                existingTx.Tags.Clear();
                if (request.TagIds != null && request.TagIds.Any())
                {
                    var tags = await _context.TblTags
                        .Where(t => request.TagIds.Contains(t.Id) && t.UserId == userId)
                        .ToListAsync();
                    foreach (var tag in tags)
                    {
                        existingTx.Tags.Add(tag);
                    }
                }

                await _context.SaveChangesAsync();
                await transactionScope.CommitAsync();

                return Result.Success(MapToResponse(existingTx));
            }
            catch
            {
                await transactionScope.RollbackAsync();
                throw;
            }
        }

        public async Task<Result> DeleteTransactionAsync(Guid userId, Guid transactionId)
        {
            var existingTx = await _context.TblTransactions
                .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId);

            if (existingTx == null)
            {
                return Result.Failure(CustomErrors.Transaction.NotFound);
            }

            using var transactionScope = await _context.Database.BeginTransactionAsync();
            try
            {
                // Revert balance changes
                var revertResult = await AdjustAccountBalancesAsync(userId, existingTx.TransactionType, existingTx.AccountId, existingTx.TargetAccountId, existingTx.Amount, isRevert: true);
                if (revertResult.IsFailure)
                {
                    await transactionScope.RollbackAsync();
                    return revertResult;
                }

                // Soft-delete the transaction
                existingTx.DeleteFlag = true;

                await _context.SaveChangesAsync();
                await transactionScope.CommitAsync();

                return Result.Success();
            }
            catch
            {
                await transactionScope.RollbackAsync();
                throw;
            }
        }

        private async Task<Result> AdjustAccountBalancesAsync(Guid userId, string transactionType, Guid accountId, Guid? targetAccountId, decimal amount, bool isRevert)
        {
            if (transactionType == "Income")
            {
                var result = isRevert
                    ? await _accountService.DebitAccountAsync(userId, accountId, amount)
                    : await _accountService.CreditAccountAsync(userId, accountId, amount);

                if (result.IsFailure) return result;
            }
            else if (transactionType == "Expense")
            {
                var result = isRevert
                    ? await _accountService.CreditAccountAsync(userId, accountId, amount)
                    : await _accountService.DebitAccountAsync(userId, accountId, amount);

                if (result.IsFailure) return result;
            }
            else if (transactionType == "Transfer")
            {
                if (targetAccountId == null)
                {
                    return Result.Failure(CustomErrors.Transaction.MissingTargetAccount);
                }
                if (accountId == targetAccountId)
                {
                    return Result.Failure(CustomErrors.Transaction.SameAccounts);
                }

                if (isRevert)
                {
                    var creditRes = await _accountService.CreditAccountAsync(userId, accountId, amount);
                    if (creditRes.IsFailure) return creditRes;

                    var debitRes = await _accountService.DebitAccountAsync(userId, targetAccountId.Value, amount);
                    if (debitRes.IsFailure) return debitRes;
                }
                else
                {
                    var debitRes = await _accountService.DebitAccountAsync(userId, accountId, amount);
                    if (debitRes.IsFailure) return debitRes;

                    var creditRes = await _accountService.CreditAccountAsync(userId, targetAccountId.Value, amount);
                    if (creditRes.IsFailure) return creditRes;
                }
            }

            return Result.Success();
        }

        public async Task<Result<IEnumerable<CategoryResponse>>> GetCategoriesAsync(Guid userId)
        {
            var categories = await _context.TblCategories
                .Where(c => c.UserId == userId && !c.DeleteFlag)
                .OrderBy(c => c.Name)
                .Select(c => new CategoryResponse(c.Id, c.Name, c.Type, c.Icon, c.Color))
                .ToListAsync();

            return Result.Success<IEnumerable<CategoryResponse>>(categories);
        }

        public async Task<Result<IEnumerable<TagResponse>>> GetTagsAsync(Guid userId)
        {
            var tags = await _context.TblTags
                .Where(t => t.UserId == userId && !t.DeleteFlag)
                .OrderBy(t => t.Name)
                .Select(t => new TagResponse(t.Id, t.Name, t.Color))
                .ToListAsync();

            return Result.Success<IEnumerable<TagResponse>>(tags);
        }

        private static TransactionResponse MapToResponse(TblTransaction transaction)
        {
            return new TransactionResponse
            {
                Id = transaction.Id,
                UserId = transaction.UserId,
                AccountId = transaction.AccountId,
                TargetAccountId = transaction.TargetAccountId,
                CategoryId = transaction.CategoryId,
                TransactionType = transaction.TransactionType,
                Date = transaction.Date,
                Amount = transaction.Amount,
                Description = transaction.Description,
                CreatedAt = transaction.CreatedAt ?? DateTime.UtcNow,
                TagIds = transaction.Tags.Select(t => t.Id).ToList(),
                TagNames = transaction.Tags.Select(t => t.Name).ToList()
            };
        }

        public async Task<Result<CategoryResponse>> CreateCategoryAsync(Guid userId, CreateCategoryRequest request)
        {
            if (request == null)
            {
                return Result.Failure<CategoryResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var nameLower = request.Name.Trim().ToLower();
            var exists = await _context.TblCategories
                .AnyAsync(c => c.UserId == userId && c.Name.ToLower() == nameLower && !c.DeleteFlag);

            if (exists)
            {
                return Result.Failure<CategoryResponse>(CustomErrors.Validation.InvalidInput("Category with this name already exists."));
            }

            var category = new TblCategory
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name.Trim(),
                Type = request.Type,
                Icon = request.Icon,
                Color = request.Color,
                IsDefault = false,
                DeleteFlag = false
            };

            _context.TblCategories.Add(category);
            await _context.SaveChangesAsync();

            return Result.Success(new CategoryResponse(category.Id, category.Name, category.Type, category.Icon, category.Color));
        }

        public async Task<Result<TagResponse>> CreateTagAsync(Guid userId, CreateTagRequest request)
        {
            if (request == null)
            {
                return Result.Failure<TagResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var nameLower = request.Name.Trim().ToLower();
            var exists = await _context.TblTags
                .AnyAsync(t => t.UserId == userId && t.Name.ToLower() == nameLower && !t.DeleteFlag);

            if (exists)
            {
                return Result.Failure<TagResponse>(CustomErrors.Validation.InvalidInput("Tag with this name already exists."));
            }

            var tag = new TblTag
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name.Trim(),
                Color = request.Color,
                DeleteFlag = false
            };

            _context.TblTags.Add(tag);
            await _context.SaveChangesAsync();

            return Result.Success(new TagResponse(tag.Id, tag.Name, tag.Color));
        }
    }
}