using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblTransaction
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid AccountId { get; set; }

    public Guid? TargetAccountId { get; set; }

    public Guid? CategoryId { get; set; }

    public decimal Amount { get; set; }

    public string TransactionType { get; set; } = null!;

    public DateTime Date { get; set; }

    public string? Description { get; set; }

    public bool? IsRecurringCreated { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual TblAccount Account { get; set; } = null!;

    public virtual TblCategory? Category { get; set; }

    public virtual TblAccount? TargetAccount { get; set; }

    public virtual ICollection<TblSavingsContribution> TblSavingsContributions { get; set; } = new List<TblSavingsContribution>();

    public virtual TblUser User { get; set; } = null!;

    public virtual ICollection<TblTag> Tags { get; set; } = new List<TblTag>();
}
