using FluentEmail.Core;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Accounts;
using ST_finance.Domain.Features.Authentication;
using ST_finance.Domain.Features.RecurringSchedules;
using ST_finance.Domain.Features.Transactions;

namespace ST_finance.Domain;

public static class FeatureManager
{
    public static void AddDomain(this WebApplicationBuilder builder)
    {
        builder.Services.AddDomainServices(builder.Configuration);
    }

    public static IServiceCollection AddDomainServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = PostgresConnectionString.Normalize(
            configuration.GetConnectionString("DbConnection"));
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddIdentityCore<TblUser>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 6;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireLowercase = false;
            options.User.RequireUniqueEmail = true;
        })
        .AddRoles<IdentityRole<Guid>>()
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();
        var gmail = configuration.GetSection("Gmail");
        var smtpHost = gmail["SmtpHost"] ?? "smtp.gmail.com";
        var username = gmail["Username"] ?? "[EMAIL_ADDRESS]";
        var password = gmail["Password"] ?? "";
        var fromEmail = gmail["FromEmail"] ?? "[EMAIL_ADDRESS]";

        services.AddFluentEmail(fromEmail)
                .AddSmtpSender(smtpHost, 587, username, password);

        services.AddScoped<IEmailService, EmailService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IRecurringScheduleService, RecurringScheduleService>();
        services.AddScoped<Features.Jobs.IRecurringJobService, Features.Jobs.RecurringJobService>();
        services.AddScoped<Features.Jobs.IScheduledJobDispatcher, Features.Jobs.ScheduledJobDispatcher>();
        services.AddScoped<Features.Jobs.INotificationSchedulingJob, Features.Jobs.NotificationSchedulingJob>();
        services.AddScoped<Features.SavingsGoals.ISavingsGoalService, Features.SavingsGoals.SavingsGoalService>();
        services.AddScoped<Features.Dashboard.IDashboardService, Features.Dashboard.DashboardService>();
        services.AddScoped<Features.Jobs.IQuotaLoggingJob, Features.Jobs.QuotaLoggingJob>();
        services.AddScoped<Features.Budgets.IBudgetService, Features.Budgets.BudgetService>();
        services.AddScoped<Features.Reports.IReportService, Features.Reports.ReportService>();
        services.AddScoped<Features.Notifications.IDailyReminderNotificationEvaluator, Features.Notifications.DailyReminderNotificationService>();
        services.AddScoped<Features.Notifications.IFunNotificationEvaluator, Features.Notifications.FunNotificationEvalutor>();
        return services;
    }
}
