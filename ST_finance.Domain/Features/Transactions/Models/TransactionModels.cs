using System;
using System.Collections.Generic;

namespace ST_finance.Domain.Features.Transactions.Models
{
    public class TransactionRequest
    {
        public Guid AccountId { get; set; }
        public Guid? TargetAccountId { get; set; }
        public Guid? CategoryId { get; set; }
        public string TransactionType { get; set; } = null!;
        public bool IsRecurring { get; set; }
        public DateTime Date { get; set; }
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public List<Guid>? TagIds { get; set; }
    }

    public class TransactionResponse
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid AccountId { get; set; }
        public Guid? CategoryId { get; set; }
        public string TransactionType { get; set; } = null!;
        public DateTime Date { get; set; }
        public Guid? TargetAccountId { get; set; }
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<Guid> TagIds { get; set; } = new List<Guid>();
        public List<string> TagNames { get; set; } = new List<string>();
    }

    public record CategoryResponse(
        Guid Id,
        string Name,
        string Type,
        string? Icon,
        string? Color
    );

    public record TagResponse(
        Guid Id,
        string Name,
        string? Color
    );
}
