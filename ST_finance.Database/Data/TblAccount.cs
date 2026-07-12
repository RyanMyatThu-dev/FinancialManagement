using System;
using System.Collections.Generic;
using ST_finance.Shared.Enums;

namespace ST_finance.Database.Data;

public partial class TblAccount
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;

    public AccountType AccountType { get; set; }

    public decimal? Balance { get; set; }

    public string Color { get; set; } = null!;

    public string Icon { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual ICollection<TblRecurringSchedule> TblRecurringScheduleAccounts { get; set; } = new List<TblRecurringSchedule>();

    public virtual ICollection<TblRecurringSchedule> TblRecurringScheduleTargetAccounts { get; set; } = new List<TblRecurringSchedule>();

    public virtual ICollection<TblTransaction> TblTransactionAccounts { get; set; } = new List<TblTransaction>();

    public virtual ICollection<TblTransaction> TblTransactionTargetAccounts { get; set; } = new List<TblTransaction>();

    public virtual TblUser User { get; set; } = null!;
}
