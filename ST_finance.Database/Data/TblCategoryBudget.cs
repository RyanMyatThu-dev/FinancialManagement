using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblCategoryBudget
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid CategoryId { get; set; }

    public decimal LimitAmount { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual TblCategory Category { get; set; } = null!;

    public virtual TblUser User { get; set; } = null!;
}
