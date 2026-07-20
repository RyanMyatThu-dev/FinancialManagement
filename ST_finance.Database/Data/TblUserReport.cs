using System;

namespace ST_finance.Database.Data
{
    public class TblUserReport
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Status { get; set; } = "Open"; // "Open", "InProgress", "Resolved"
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool DeleteFlag { get; set; }

        public virtual TblUser User { get; set; } = null!;
    }
}
