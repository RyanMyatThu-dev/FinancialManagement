using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts.Models;
using ST_finance.Shared;
using ST_finance.Shared.Enums;

namespace ST_finance.Domain.Features.Accounts
{
    public class AccountService : IAccountService
    {
        private readonly AppDbContext _context;

        public AccountService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<PagedResponse<AccountResponse>>> GetAccountsAsync(Guid userId, int pageNumber, int pageSize)
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize  < 1) pageSize  = 20;
            if (pageSize  > 100) pageSize = 100;

            var query = _context.TblAccounts
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Name);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var responses = items.Select(MapToResponse).ToList();
            return Result.Success(PagedResponse<AccountResponse>.Create(responses, totalCount, pageNumber, pageSize));
        }

        public async Task<Result<AccountResponse>> CreateAccountAsync(Guid userId, CreateAccountRequest request)
        {
            // 1. Service-level input validations
            if (request == null)
            {
                return Result.Failure<AccountResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Result.Failure<AccountResponse>(CustomErrors.Validation.InvalidInput("Account name is required."));
            }

            if (request.AccountType == AccountType.None)
            {
                return Result.Failure<AccountResponse>(CustomErrors.Validation.InvalidInput("Account type must be Bank, EWallet, TransitCard, or Cash."));
            }

            // 2. Validate unique account name per user
            var nameExists = await _context.TblAccounts
                .AnyAsync(a => a.UserId == userId && a.Name.ToLower() == request.Name.ToLower());
            
            if (nameExists)
            {
                return Result.Failure<AccountResponse>(CustomErrors.Account.DuplicateName);
            }

            // 3. Create the account
            var account = new TblAccount
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                AccountType = request.AccountType,
                Balance = request.Balance,
                Color = string.IsNullOrEmpty(request.Color) ? "#4F46E5" : request.Color,
                Icon = string.IsNullOrEmpty(request.Icon) ? "Wallet" : request.Icon,
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            return Result.Success(MapToResponse(account));
        }

        public async Task<Result<AccountResponse>> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request)
        {
            if (request == null)
            {
                return Result.Failure<AccountResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var account = await _context.TblAccounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
            {
                return Result.Failure<AccountResponse>(CustomErrors.Account.NotFound);
            }

            // 1. Name unique constraint check (if name is being modified)
            if (!string.IsNullOrEmpty(request.Name) && !account.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase))
            {
                var nameExists = await _context.TblAccounts
                    .AnyAsync(a => a.UserId == userId && a.Id != accountId && a.Name.ToLower() == request.Name.ToLower());

                if (nameExists)
                {
                    return Result.Failure<AccountResponse>(CustomErrors.Account.DuplicateName);
                }
                account.Name = request.Name;
            }

            // 2. Map optional updates
            if (!string.IsNullOrEmpty(request.Color))
            {
                account.Color = request.Color;
            }

            if (!string.IsNullOrEmpty(request.Icon))
            {
                account.Icon = request.Icon;
            }

            if (request.Balance.HasValue)
            {
                account.Balance = request.Balance.Value;
            }

            await _context.SaveChangesAsync();

            return Result.Success(MapToResponse(account));
        }

        public async Task<Result> DeleteAccountAsync(Guid userId, Guid accountId, bool force)
        {
            var account = await _context.TblAccounts
                .Include(a => a.TblTransactionAccounts)
                .Include(a => a.TblTransactionTargetAccounts)
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
            {
                return Result.Failure(CustomErrors.Account.NotFound);
            }

            var hasTransactions = account.TblTransactionAccounts.Any() || account.TblTransactionTargetAccounts.Any();

            if (hasTransactions)
            {
                if (!force)
                {
                    return Result.Failure(CustomErrors.Account.HasTransactions);
                }

                // Tweak properties to soft-delete the account and its transaction histories
                account.DeleteFlag = true;
                foreach (var tx in account.TblTransactionAccounts)
                {
                    tx.DeleteFlag = true;
                }
                foreach (var tx in account.TblTransactionTargetAccounts)
                {
                    tx.DeleteFlag = true;
                }
                await _context.SaveChangesAsync();
            }
            else
            {
                // Soft-delete the account
                account.DeleteFlag = true;
                await _context.SaveChangesAsync();
            }

            return Result.Success();
        }

        public async Task<Result> CreditAccountAsync(Guid userId, Guid accountId, decimal amount)
        {
            if (amount < 0)
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("Amount must be non-negative."));
            }

            var account = await _context.TblAccounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
            {
                return Result.Failure(CustomErrors.Account.NotFound);
            }

            account.Balance = (account.Balance ?? 0m) + amount;
            await _context.SaveChangesAsync();
            return Result.Success();
        }

        public async Task<Result> DebitAccountAsync(Guid userId, Guid accountId, decimal amount)
        {
            if (amount < 0)
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("Amount must be non-negative."));
            }

            var account = await _context.TblAccounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
            {
                return Result.Failure(CustomErrors.Account.NotFound);
            }

            account.Balance = (account.Balance ?? 0m) - amount;
            await _context.SaveChangesAsync();
            return Result.Success();
        }

        private static AccountResponse MapToResponse(TblAccount account)
        {
            return new AccountResponse(
                Id: account.Id,
                UserId: account.UserId,
                Name: account.Name,
                AccountType: account.AccountType,
                Balance: account.Balance ?? 0.00m,
                Color: account.Color,
                Icon: account.Icon,
                CreatedAt: account.CreatedAt ?? DateTime.UtcNow
            );
        }
    }
}