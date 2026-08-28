using Hangfire.Dashboard;

namespace ST_finance.Api;

/// <summary>
/// Only allows an already-authenticated user to view the Hangfire dashboard.
/// The dashboard is only ever mapped in Development (see Program.cs), so this
/// is a defense-in-depth guard, not the primary access control.
/// </summary>
public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        return httpContext.User.Identity?.IsAuthenticated == true;
    }
}
