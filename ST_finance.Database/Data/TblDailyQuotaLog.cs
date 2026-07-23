using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblDailyQuotaLog
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public DateOnly Date { get; set; }

    public decimal TargetQuota { get; set; }

    public decimal ActualSpent { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual TblUser User { get; set; } = null!;
}
