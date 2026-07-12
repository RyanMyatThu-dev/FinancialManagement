using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace ST_finance.Database.Data;

public partial class TblUser : IdentityUser<Guid>
{
    public string? FullName { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiryTime { get; set; }

    public bool DeleteFlag { get; set; }

    public virtual ICollection<TblAccount> TblAccounts { get; set; } = new List<TblAccount>();

    public virtual ICollection<TblCategory> TblCategories { get; set; } = new List<TblCategory>();

    public virtual ICollection<TblCategoryBudget> TblCategoryBudgets { get; set; } = new List<TblCategoryBudget>();

    public virtual ICollection<TblDailyQuotaLog> TblDailyQuotaLogs { get; set; } = new List<TblDailyQuotaLog>();

    public virtual ICollection<TblRecurringSchedule> TblRecurringSchedules { get; set; } = new List<TblRecurringSchedule>();

    public virtual ICollection<TblSavingsGoal> TblSavingsGoals { get; set; } = new List<TblSavingsGoal>();

    public virtual ICollection<TblTag> TblTags { get; set; } = new List<TblTag>();

    public virtual ICollection<TblTransaction> TblTransactions { get; set; } = new List<TblTransaction>();

    public virtual TblUserProfile? TblUserProfile { get; set; }
}
