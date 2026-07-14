using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblSavingsGoal
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string GoalName { get; set; } = null!;

    public decimal TargetAmount { get; set; }

    public DateTime? TargetDate { get; set; }

    public bool? IsCompleted { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual ICollection<TblSavingsContribution> TblSavingsContributions { get; set; } = new List<TblSavingsContribution>();

    public virtual TblUser User { get; set; } = null!;
}
