using Amazon.Lambda.AspNetCoreServer.Hosting;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using ST_finance.Domain;
using ST_finance.Domain.Features.RecurringSchedules;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddApplicationPart(typeof(FeatureManager).Assembly);
builder.AddDomain();

builder.Services.AddCors(options =>
{
    // Local development: allow localhost frontend
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });

    // Staging / Production: allow Vercel frontend domain
    options.AddPolicy("AllowVercel", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  // Check if the origin matches our main domain or any Vercel preview domain
                  var uri = new Uri(origin);
                  return uri.Host == "st-finance.vercel.app" || uri.Host.EndsWith(".vercel.app");
              })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid token in the text input below.\r\n\r\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\""
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings.GetValue<string>("SecretKey");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.GetValue<string>("Issuer"),
        ValidAudience = jwtSettings.GetValue<string>("Audience"),
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey!)),
        ClockSkew = TimeSpan.Zero
    };
});

var connectionString = builder.Configuration.GetConnectionString("DbConnection");
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString)));

// Hangfire server only runs locally. Lambda is stateless — it cannot host
// a persistent background polling thread. Recurring jobs are handled separately.
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddHangfireServer();
}

builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

var app = builder.Build();

// Apply automatic migration on startup (guarded)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ST_finance.Database.Data.AppDbContext>();


        var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
        if (pendingMigrations.Any())
        {
            await context.Database.MigrateAsync();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during startup database migration.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapSwagger("/openapi/{documentName}.json");
    app.MapScalarApiReference();
}

// API Gateway already terminates HTTPS. Redirecting inside Lambda causes
// unnecessary 301 loops. Only redirect in local development.
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Apply the correct CORS policy based on the environment
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowLocalhost");
}
else
{
    app.UseCors("AllowVercel");
}

app.UseAuthentication();
app.UseAuthorization();

// Hangfire dashboard and recurring jobs only register in local development.
// In Lambda (Staging/Production), these are stateless invocations — there is
// no persistent thread to process Hangfire queues.
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard();

    RecurringJob.AddOrUpdate<ST_finance.Domain.Features.RecurringSchedules.RecurringJobService>(
        "ProcessRecurringSchedules",
        job => job.ProcessRecurringSchedulesAsync(),
        Cron.Hourly());

    RecurringJob.AddOrUpdate<ST_finance.Domain.Features.Dashboard.QuotaLoggingJob>(
        "LogDailyQuotas",
        job => job.LogDailyQuotasAsync(),
        Cron.Daily(17));
}

app.MapControllers();

app.Run();
