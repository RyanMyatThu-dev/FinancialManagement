using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ST_finance.Database.Data;

namespace ST_finance.Domain.Features.Notifications;

public class DailyReminderNotificationService : IDailyReminderNotificationEvaluator
{
    private readonly AppDbContext _context;
    private readonly ILogger<DailyReminderNotificationService>? _logger;

    public DailyReminderNotificationService(
        AppDbContext context,
        ILogger<DailyReminderNotificationService>? logger = null)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EvaluateAsync()
    {
        var nowUtc = DateTime.UtcNow;

        var duePreferences = await _context.TblNotificationPreferences
            .Include(pref => pref.User)
                .ThenInclude(user => user.TblUserProfile)
            .Where(pref => pref.DailyReminderEnabled
                && pref.NextDailyReminderAt != null
                && pref.NextDailyReminderAt <= nowUtc
                && !pref.User.DeleteFlag)
            .ToListAsync();

        foreach (var preference in duePreferences)
        {
            var timeZoneId = preference.User.TblUserProfile?.TimeZoneId;
            var timeZone = ResolveTimeZone(timeZoneId);

            var occurrenceUtc = preference.NextDailyReminderAt!.Value;
            var occurrenceUtcSpecified = DateTime.SpecifyKind(occurrenceUtc, DateTimeKind.Utc);
            var occurrenceLocal = TimeZoneInfo.ConvertTimeFromUtc(occurrenceUtcSpecified, timeZone);

            var scheduledForUtc = CalculateScheduledForUtc(
                occurrenceUtcSpecified,
                timeZone,
                preference.QuietHoursStart,
                preference.QuietHoursEnd);

            var dedupeKey = $"daily-reminder:{occurrenceLocal:dd-MM-yyyy}";

            var alreadyExists = await _context.TblNotifications
                .AnyAsync(n => n.UserId == preference.UserId && n.DedupeKey == dedupeKey);

            if (!alreadyExists)
            {
                var notification = new TblNotification
                {
                    Id = Guid.NewGuid(),
                    UserId = preference.UserId,
                    Type = "DailyReminder",
                    DedupeKey = dedupeKey,
                    Title = "Daily Reminder",
                    Body = "Take a moment to record your transactions for today.",
                    ActionUrl = "/transactions",
                    Status = "Pending",
                    ScheduledFor = scheduledForUtc,
                    ExpiresAt = scheduledForUtc.AddDays(1),
                    CreatedAt = nowUtc
                };

                _context.TblNotifications.Add(notification);
                _logger?.LogInformation(
                    "Created daily reminder notification for user {UserId} scheduled for {ScheduledForUtc}",
                    preference.UserId,
                    scheduledForUtc);
            }

            preference.NextDailyReminderAt = CalculateNextDailyReminderUtc(
                occurrenceLocal,
                preference.DailyReminderTime,
                timeZone,
                nowUtc);
            preference.UpdatedAt = nowUtc;
        }

        await _context.SaveChangesAsync();
    }

    private static DateTime ApplyQuietHours(
        DateTime scheduledLocal,
        TimeOnly? quietHoursStart,
        TimeOnly? quietHoursEnd)
    {
        if (quietHoursStart is null || quietHoursEnd is null)
        {
            return scheduledLocal;
        }

        var start = quietHoursStart.Value;
        var end = quietHoursEnd.Value;
        var scheduledTime = TimeOnly.FromDateTime(scheduledLocal);

        if (start == end)
        {
            return scheduledLocal;
        }

        if (start < end)
        {
            var isQuiet = scheduledTime >= start && scheduledTime < end;
            return isQuiet ? scheduledLocal.Date.Add(end.ToTimeSpan()) : scheduledLocal;
        }

        // Overnight quiet period, e.g. 22:00 -> 07:00
        var isInEveningPortion = scheduledTime >= start;
        var isInMorningPortion = scheduledTime < end;

        if (isInEveningPortion)
        {
            return scheduledLocal.Date.AddDays(1).Add(end.ToTimeSpan());
        }

        if (isInMorningPortion)
        {
            return scheduledLocal.Date.Add(end.ToTimeSpan());
        }

        return scheduledLocal;
    }

    private static DateTime CalculateScheduledForUtc(
        DateTime occurrenceUtc,
        TimeZoneInfo timeZone,
        TimeOnly? quietHoursStart,
        TimeOnly? quietHoursEnd)
    {
        var utcReminder = DateTime.SpecifyKind(occurrenceUtc, DateTimeKind.Utc);
        var reminderLocal = TimeZoneInfo.ConvertTimeFromUtc(utcReminder, timeZone);
        var allowedLocal = ApplyQuietHours(reminderLocal, quietHoursStart, quietHoursEnd);
        var unspecifiedLocal = DateTime.SpecifyKind(allowedLocal, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecifiedLocal, timeZone);
    }

    private static DateTime CalculateNextDailyReminderUtc(
        DateTime currentOccurrenceLocal,
        TimeOnly reminderTime,
        TimeZoneInfo timeZone,
        DateTime nowUtc)
    {
        var nextLocal = currentOccurrenceLocal.Date.AddDays(1).Add(reminderTime.ToTimeSpan());
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc), timeZone);

        while (nextLocal <= nowLocal)
        {
            nextLocal = nextLocal.AddDays(1);
        }

        var unspecifiedNext = DateTime.SpecifyKind(nextLocal, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecifiedNext, timeZone);
    }

    private static TimeZoneInfo ResolveTimeZone(string? timeZoneId)
    {
        if (!string.IsNullOrWhiteSpace(timeZoneId))
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (Exception)
            {
                // Fall back to default
            }
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok");
        }
        catch (Exception)
        {
            return TimeZoneInfo.Utc;
        }
    }
}
