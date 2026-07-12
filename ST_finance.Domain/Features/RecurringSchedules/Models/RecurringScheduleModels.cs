using System;
using System.ComponentModel.DataAnnotations;

namespace ST_finance.Domain.Features.RecurringSchedules.Models
{
    public record CreateRecurringScheduleRequest(
        [Required] Guid AccountId,
        Guid? TargetAccountId,
        Guid? CategoryId,
        [Required][MaxLength(150)] string Name,
        [Required] decimal Amount,
        [Required][RegularExpression("^(Income|Expense|Transfer)$", ErrorMessage = "TransactionType must be Income, Expense, or Transfer.")] string TransactionType,
        [Required][RegularExpression("^(Daily|Weekly|Monthly|Yearly)$", ErrorMessage = "Frequency must be Daily, Weekly, Monthly, or Yearly.")] string Frequency,
        [Required] DateTime StartDate,
        DateTime? EndDate
    );

    public record RecurringScheduleResponse(
        Guid Id,
        Guid UserId,
        Guid AccountId,
        Guid? TargetAccountId,
        Guid? CategoryId,
        string Name,
        decimal Amount,
        string TransactionType,
        string Frequency,
        DateTime StartDate,
        DateTime? EndDate,
        DateTime? LastTriggeredAt,
        DateTime NextOccurrenceDate,
        DateTime CreatedAt
    );
}
