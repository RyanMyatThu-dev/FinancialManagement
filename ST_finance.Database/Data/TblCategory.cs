using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblCategory
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Type { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string Icon { get; set; } = null!;

    public bool? IsDefault { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual ICollection<TblCategoryBudget> TblCategoryBudgets { get; set; } = new List<TblCategoryBudget>();

    public virtual ICollection<TblRecurringSchedule> TblRecurringSchedules { get; set; } = new List<TblRecurringSchedule>();

    public virtual ICollection<TblTransaction> TblTransactions { get; set; } = new List<TblTransaction>();

    public virtual TblUser User { get; set; } = null!;
}
