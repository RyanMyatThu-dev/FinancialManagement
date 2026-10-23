namespace ST_finance.Database.Data;

public partial class TblNotificationDelivery
{
    public Guid Id { get; set; }

    public Guid NotificationId { get; set; }

    public Guid? PushSubscriptionId { get; set; }

    public string Status { get; set; } = null!;

    public int AttemptCount { get; set; }

    public DateTime? LastAttemptAt { get; set; }

    public DateTime? SentAt { get; set; }

    public string? FailureCode { get; set; }

    public string? FailureMessage { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual TblNotification Notification { get; set; } = null!;

    public virtual TblPushSubscription? PushSubscription { get; set; }
}
