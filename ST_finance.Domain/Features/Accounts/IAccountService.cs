using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Accounts.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Accounts
{
    public interface IAccountService
    {
        Task<Result<PagedResponse<AccountResponse>>> GetAccountsAsync(Guid userId, int pageNumber, int pageSize);
        Task<Result<AccountResponse>> CreateAccountAsync(Guid userId, CreateAccountRequest request);
        Task<Result<AccountResponse>> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request);
        Task<Result> DeleteAccountAsync(Guid userId, Guid accountId, bool force);
        Task<Result> CreditAccountAsync(Guid userId, Guid accountId, decimal amount);
        Task<Result> DebitAccountAsync(Guid userId, Guid accountId, decimal amount);
    }
}