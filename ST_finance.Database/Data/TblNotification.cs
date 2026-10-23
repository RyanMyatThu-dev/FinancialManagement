namespace ST_finance.Database.Data;

public partial class TblNotification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Type { get; set; } = null!;

    public string? DedupeKey { get; set; }

    public string Title { get; set; } = null!;

    public string Body { get; set; } = null!;

    public string? ActionUrl { get; set; }

    public string? DataJson { get; set; }

    public string Status { get; set; } = null!;

    public DateTime ScheduledFor { get; set; }

    public DateTime? QueuedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual TblUser User { get; set; } = null!;

    public virtual ICollection<TblNotificationDelivery> TblNotificationDeliveries { get; set; } = new List<TblNotificationDelivery>();
}
