using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblUserProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public decimal? MonthlyAllowanceAmount { get; set; }

    public int? AllowanceDayOfMonth { get; set; }

    public decimal? TargetMonthlySavings { get; set; }

    public string? Currency { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual TblUser User { get; set; } = null!;
}
