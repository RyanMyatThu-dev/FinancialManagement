namespace ST_finance.Database.Data;

public partial class TblNotificationPreference
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public bool DailyReminderEnabled { get; set; }

    public TimeOnly DailyReminderTime { get; set; }

    public DateTime? NextDailyReminderAt { get; set; }

    public bool BalanceAlertsEnabled { get; set; }

    public bool FunNotificationsEnabled { get; set; }

    public TimeOnly? QuietHoursStart { get; set; }

    public TimeOnly? QuietHoursEnd { get; set; }

    public bool ShowSensitiveContent { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual TblUser User { get; set; } = null!;
}
