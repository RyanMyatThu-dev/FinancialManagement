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
            string? timeframe = null
        );
        Task<Result<TransactionResponse>> CreateTransactionAsync(Guid userId, TransactionRequest request);
        Task<Result<TransactionResponse>> UpdateTransactionAsync(Guid userId, Guid transactionId, TransactionRequest request);
        Task<Result> DeleteTransactionAsync(Guid userId, Guid transactionId);
        Task<Result<IEnumerable<CategoryResponse>>> GetCategoriesAsync(Guid userId);
        Task<Result<IEnumerable<TagResponse>>> GetTagsAsync(Guid userId);
    }
}