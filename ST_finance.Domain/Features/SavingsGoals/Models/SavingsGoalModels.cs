using System;
using System.ComponentModel.DataAnnotations;

namespace ST_finance.Domain.Features.SavingsGoals.Models
{
    public record CreateSavingsGoalRequest(
        [Required][MaxLength(150)] string GoalName,
        [Required] decimal TargetAmount,
        DateTime? TargetDate
    );

    public record ContributeRequest(
        [Required] decimal Amount,
        [MaxLength(250)] string? Note
    );

    public record SavingsGoalResponse(
        Guid Id,
        Guid UserId,
        string GoalName,
        decimal TargetAmount,
        DateTime? TargetDate,
        bool IsCompleted,
        decimal CurrentAmount,
        DateTime CreatedAt
    );

    public record SavingsContributionResponse(
        Guid Id,
        Guid SavingsGoalId,
        Guid? TransactionId,
        decimal Amount,
        DateTime Date,
        string? Note
    );
}
