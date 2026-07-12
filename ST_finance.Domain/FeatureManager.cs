using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Authentication;
using ST_finance.Domain.Features.Transactions;
using ST_finance.Domain.Features.RecurringSchedules;
using ST_finance.Domain.Features.Accounts;

namespace ST_finance.Domain;

public static class FeatureManager
{
    public static void AddDomain(this WebApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("DbConnection");
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        builder.Services.AddIdentityCore<TblUser>(options =>
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

        builder.Services.AddTransient<Resend.IResend>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var apiKey = config["Resend:ApiKey"];
            return Resend.ResendClient.Create(apiKey ?? "re_temp");
        });
        builder.Services.AddScoped<IEmailService, EmailService>();

        builder.Services.AddScoped<IAuthService, AuthService>();
        builder.Services.AddScoped<ITokenService, TokenService>();
        builder.Services.AddScoped<IAccountService, AccountService>();
        builder.Services.AddScoped<ITransactionService, TransactionService>();
        builder.Services.AddScoped<IRecurringScheduleService, RecurringScheduleService>();
        builder.Services.AddScoped<RecurringJobService>();
        builder.Services.AddScoped<ST_finance.Domain.Features.SavingsGoals.ISavingsGoalService, ST_finance.Domain.Features.SavingsGoals.SavingsGoalService>();
        builder.Services.AddScoped<ST_finance.Domain.Features.Dashboard.IDashboardService, ST_finance.Domain.Features.Dashboard.DashboardService>();
        builder.Services.AddScoped<ST_finance.Domain.Features.Dashboard.QuotaLoggingJob>();
        builder.Services.AddScoped<ST_finance.Domain.Features.Budgets.IBudgetService, ST_finance.Domain.Features.Budgets.BudgetService>();
    }
}
