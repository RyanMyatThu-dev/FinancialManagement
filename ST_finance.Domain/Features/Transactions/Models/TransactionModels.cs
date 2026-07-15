using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

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

    public class TransactionSearchRequest
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public Guid? CategoryId { get; set; }
        public Guid? TagId { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public string? Search { get; set; }
        public string? Timeframe { get; set; }
        public Guid? AccountId { get; set; }
        public Guid? SourceAccountId { get; set; }
        public Guid? TargetAccountId { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? TransactionType { get; set; }
    }

    public record TransactionSummaryResponse(
        decimal Inflow,
        decimal Outflow
    );

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

    public record CreateCategoryRequest(
        [Required][MaxLength(100)] string Name,
        [Required][MaxLength(10)] string Type,
        [Required][MaxLength(50)] string Icon,
        [Required][MaxLength(7)] string Color
    );

    public record CreateTagRequest(
        [Required][MaxLength(50)] string Name,
        [Required][MaxLength(7)] string Color
    );
}
