using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts.Models;
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

        public async Task<IEnumerable<AccountResponse>> GetAccountsAsync(Guid userId)
        {
            var accounts = await _context.TblAccounts
                .Where(a => a.UserId == userId)
                .OrderBy(a => a.Name)
                .ToListAsync();

            return accounts.Select(MapToResponse);
        }

        public async Task<AccountResponse> CreateAccountAsync(Guid userId, CreateAccountRequest request)
        {
            
            var nameExists = await _context.TblAccounts
                .AnyAsync(a => a.UserId == userId && a.Name.ToLower() == request.Name.ToLower());
            
            if (nameExists)
            {
                throw new ArgumentException($"An account with the name '{request.Name}' already exists.");
            }

        
            var account = new TblAccount
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                AccountType = request.AccountType,
                Balance = request.Balance,
                Color = string.IsNullOrEmpty(request.Color) ? "#4F46E5" : request.Color,
                Icon = string.IsNullOrEmpty(request.Icon) ? "Wallet" : request.Icon,
                CreatedAt = DateTime.UtcNow
            };

            _context.TblAccounts.Add(account);
            await _context.SaveChangesAsync();

            return MapToResponse(account);
        }

        public async Task<AccountResponse> UpdateAccountAsync(Guid userId, Guid accountId, UpdateAccountRequest request)
        {
            var account = await _context.TblAccounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
            {
                throw new KeyNotFoundException("Account not found.");
            }

            
            if (!string.IsNullOrEmpty(request.Name) && !account.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase))
            {
                var nameExists = await _context.TblAccounts
                    .AnyAsync(a => a.UserId == userId && a.Id != accountId && a.Name.ToLower() == request.Name.ToLower());

                if (nameExists)
                {
                    throw new ArgumentException($"An account with the name '{request.Name}' already exists.");
                }
                account.Name = request.Name;
            }

            
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

            return MapToResponse(account);
        }

        public async Task DeleteAccountAsync(Guid userId, Guid accountId, bool force)
        {
            var account = await _context.TblAccounts
                .Include(a => a.TblTransactionAccounts)
                .Include(a => a.TblTransactionTargetAccounts)
                .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);

            if (account == null)
            {
                throw new KeyNotFoundException("Account not found.");
            }

            var hasTransactions = account.TblTransactionAccounts.Any() || account.TblTransactionTargetAccounts.Any();

            if (hasTransactions)
            {
                if (!force)
                {
                    throw new InvalidOperationException("This account is linked to transaction history and cannot be deleted. Use force delete to remove the account along with its transactions.");
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