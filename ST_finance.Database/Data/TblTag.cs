using System;
using System.Collections.Generic;

namespace ST_finance.Database.Data;

public partial class TblTag
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Color { get; set; } = null!;

    public bool DeleteFlag { get; set; }

    public virtual TblUser User { get; set; } = null!;

    public virtual ICollection<TblTransaction> Transactions { get; set; } = new List<TblTransaction>();
}
