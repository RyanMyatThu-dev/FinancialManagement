namespace ST_finance.Database.Data;

public partial class TblPushSubscription
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Endpoint { get; set; } = null!;

    public string P256dhKey { get; set; } = null!;

    public string AuthKey { get; set; } = null!;

    public string? DeviceName { get; set; }

    public string? UserAgent { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? LastSuccessAt { get; set; }

    public int FailureCount { get; set; }

    public DateTime? RevokedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual TblUser User { get; set; } = null!;

    public virtual ICollection<TblNotificationDelivery> TblNotificationDeliveries { get; set; } = new List<TblNotificationDelivery>();
}
