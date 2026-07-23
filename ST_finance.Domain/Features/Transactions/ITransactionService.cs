using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Transactions.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Transactions
{
    public interface ITransactionService
    {
        Task<Result<PagedResponse<TransactionResponse>>> GetTransactionsAsync(
            Guid userId,
            int pageNumber,
            int pageSize,
            Guid? categoryId = null,
            Guid? tagId = null,
            decimal? minAmount = null,
            decimal? maxAmount = null,
            string? search = null,
            string? timeframe = null,
            Guid? accountId = null,
            Guid? sourceAccountId = null,
            Guid? targetAccountId = null,
            string? startDate = null,
            string? endDate = null,
            string? transactionType = null
        );
        Task<Result<TransactionSummaryResponse>> GetTransactionSummaryAsync(
            Guid userId,
            Guid? categoryId = null,
            Guid? tagId = null,
            decimal? minAmount = null,
            decimal? maxAmount = null,
            string? search = null,
            string? timeframe = null,
            Guid? accountId = null,
            Guid? sourceAccountId = null,
            Guid? targetAccountId = null,
            string? startDate = null,
            string? endDate = null,
            string? transactionType = null
        );
        Task<Result<TransactionResponse>> CreateTransactionAsync(Guid userId, TransactionRequest request);
        Task<Result<TransactionResponse>> UpdateTransactionAsync(Guid userId, Guid transactionId, TransactionRequest request);
        Task<Result> DeleteTransactionAsync(Guid userId, Guid transactionId);
        Task<Result<IEnumerable<CategoryResponse>>> GetCategoriesAsync(Guid userId);
        Task<Result<IEnumerable<TagResponse>>> GetTagsAsync(Guid userId);
        Task<Result<CategoryResponse>> CreateCategoryAsync(Guid userId, CreateCategoryRequest request);
        Task<Result<TagResponse>> CreateTagAsync(Guid userId, CreateTagRequest request);
        Task<Result<PagedResponse<CategoryResponse>>> GetCategoriesPagedAsync(Guid userId, int pageNumber, int pageSize, string? search);
        Task<Result<PagedResponse<TagResponse>>> GetTagsPagedAsync(Guid userId, int pageNumber, int pageSize, string? search);
        Task<Result<PagedResponse<TransactionResponse>>> SearchTransactionsAsync(Guid userId, TransactionSearchRequest request);
        Task<Result<TransactionSummaryResponse>> GetTransactionSummarySearchAsync(Guid userId, TransactionSearchRequest request);
    }
}
