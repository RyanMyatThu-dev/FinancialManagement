using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblSavingsContribution
{
    public Guid Id { get; set; }

    public Guid SavingsGoalId { get; set; }

    public Guid? TransactionId { get; set; }

    public decimal Amount { get; set; }

    public DateTime Date { get; set; }

    public string? Note { get; set; }

    public virtual TblSavingsGoal SavingsGoal { get; set; } = null!;

    public virtual TblTransaction? Transaction { get; set; }
}
