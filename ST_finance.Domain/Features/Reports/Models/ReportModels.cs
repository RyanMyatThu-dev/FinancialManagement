using System;

namespace ST_finance.Domain.Features.Reports.Models
{
    public record SubmitReportRequest(string Title, string Description);

    public record ReportResponse(Guid Id, string Title, string Description, string Status, DateTime CreatedAt);
}
