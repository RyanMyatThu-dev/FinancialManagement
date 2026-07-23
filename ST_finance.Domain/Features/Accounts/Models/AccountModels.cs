using System;
using System.ComponentModel.DataAnnotations;
using ST_finance.Shared.Enums;

namespace ST_finance.Domain.Features.Accounts.Models
{
    public record CreateAccountRequest(
        [Required][MaxLength(100)] string Name,
        [Required][EnumDataType(typeof(AccountType), ErrorMessage = "AccountType must be Bank (1), EWallet (2), TransitCard (3), or Cash (4).")] AccountType AccountType,
        decimal Balance = 0.00m,
        [MaxLength(7)] string Color = "#4F46E5",
        [MaxLength(50)] string Icon = "Wallet"
    );

    public record UpdateAccountRequest(
        [MaxLength(100)] string? Name,
        [MaxLength(7)] string? Color,
        [MaxLength(50)] string? Icon,
        decimal? Balance
    );

    public record AccountResponse(
        Guid Id,
        Guid UserId,
        string Name,
        AccountType AccountType,
        decimal Balance,
        string Color,
        string Icon,
        DateTime CreatedAt
    );

    public class GetAccountsRequest
    {
        public string? Search { get; set; } = null;
        public AccountType? Type { get; set; } = null;
        public string? SortBy { get; set; } = null;
    }
}
