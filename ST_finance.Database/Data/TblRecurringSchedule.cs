using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblRecurringSchedule
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid AccountId { get; set; }

    public Guid? TargetAccountId { get; set; }

    public Guid? CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public decimal Amount { get; set; }

    public string TransactionType { get; set; } = null!;

    public string Frequency { get; set; } = null!;

    public int? DayOfMonth { get; set; }

    public int? DayOfWeek { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime? LastTriggeredAt { get; set; }

    public DateTime NextOccurrenceDate { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual TblAccount Account { get; set; } = null!;

    public virtual TblCategory? Category { get; set; }

    public virtual TblAccount? TargetAccount { get; set; }

    public virtual TblUser User { get; set; } = null!;
}
