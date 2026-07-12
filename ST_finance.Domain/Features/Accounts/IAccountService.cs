using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Accounts.Models;

namespace ST_finance.Domain.Features.Accounts
{
    public interface IAccountService
    {
        Task<IEnumerable<AccountResponse>> GetAccountsAsync(Guid userId);
        Task<AccountResponse> CreateAccountAsync(Guid userId, CreateAccountRequest request);
        Task<AccountResponse> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request);
        Task DeleteAccountAsync(Guid userId, Guid accountId, bool force);
    }
}