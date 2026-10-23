using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ST_finance.Database.Data;

namespace ST_finance.Domain.Features.Notifications;

public class FunNotificationEvalutor : IFunNotificationEvaluator
{
    private static readonly int[] MilestoneDays = [3, 7, 14, 30, 50, 100, 365];
    private static readonly TimeOnly FixedEveningTime = new(20, 0); // 8:00 PM local time

    private readonly AppDbContext _context;
    private readonly ILogger<FunNotificationEvalutor>? _logger;

    public FunNotificationEvalutor(
        AppDbContext context,
        ILogger<FunNotificationEvalutor>? logger = null)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EvaluateAsync()
    {
        var nowUtc = DateTime.UtcNow;

        var candidates = await _context.TblNotificationPreferences
            .Include(pref => pref.User)
                .ThenInclude(u => u.TblUserProfile)
            .Where(pref => pref.FunNotificationsEnabled && !pref.User.DeleteFlag)
            .ToListAsync();

        foreach (var preference in candidates)
        {
            var profile = preference.User.TblUserProfile;
            if (profile == null)
            {
                continue;
            }

            var timeZone = ResolveTimeZone(profile.TimeZoneId);
            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc), timeZone);
            var todayLocal = DateOnly.FromDateTime(nowLocal);

            // Calculate fixed evening reminder time in local timezone and convert to UTC
            var scheduledForUtc = CalculateEveningScheduledUtc(
                todayLocal,
                FixedEveningTime,
                timeZone,
                preference.QuietHoursStart,
                preference.QuietHoursEnd);

            string? title = null;
            string? body = null;
            string? dedupeKey = null;
            string actionUrl = "/transactions";

            // Case 1: Streak Saver - Active streak at risk of breaking tonight
            if (profile.CurrentStreak >= 1 
                && profile.LastLoggedDate != todayLocal 
                && profile.LastLoggedDate == todayLocal.AddDays(-1))
            {
                dedupeKey = $"fun:streak-saver:{preference.UserId}:{todayLocal:dd-MM-yyyy}";
                title = "Don't lose your streak! 🔥";
                body = profile.CurrentStreak == 1
                    ? "Keep yesterday's momentum going! Log today's spending before midnight to make it 2 days."
                    : $"You're on a {profile.CurrentStreak}-day streak! Take 10 seconds to log today's expenses before midnight.";
            }
            // Case 2: Streak Milestone - Just reached a major milestone today
            else if (profile.LastLoggedDate == todayLocal && MilestoneDays.Contains(profile.CurrentStreak))
            {
                dedupeKey = $"fun:streak-milestone:{preference.UserId}:{profile.CurrentStreak}:{todayLocal:dd-MM-yyyy}";
                title = $"Incredible! {profile.CurrentStreak}-Day Streak 🏆";
                body = $"You've tracked your finances for {profile.CurrentStreak} days in a row! Elite discipline.";
                actionUrl = "/dashboard";
            }

            if (dedupeKey != null && title != null && body != null)
            {
                var alreadyExists = await _context.TblNotifications
                    .AnyAsync(n => n.UserId == preference.UserId && n.DedupeKey == dedupeKey);

                if (!alreadyExists)
                {
                    var notification = new TblNotification
                    {
                        Id = Guid.NewGuid(),
                        UserId = preference.UserId,
                        Type = "FunNotification",
                        DedupeKey = dedupeKey,
                        Title = title,
                        Body = body,
                        ActionUrl = actionUrl,
                        Status = "Pending",
                        ScheduledFor = scheduledForUtc,
                        ExpiresAt = scheduledForUtc.AddDays(1),
                        CreatedAt = nowUtc
                    };

                    _context.TblNotifications.Add(notification);
                    _logger?.LogInformation(
                        "Created fun notification ({DedupeKey}) for user {UserId} scheduled for {ScheduledForUtc}",
                        dedupeKey,
                        preference.UserId,
                        scheduledForUtc);
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    private static DateTime CalculateEveningScheduledUtc(
        DateOnly dateLocal,
        TimeOnly eveningTime,
        TimeZoneInfo timeZone,
        TimeOnly? quietHoursStart,
        TimeOnly? quietHoursEnd)
    {
        var localDateTime = dateLocal.ToDateTime(eveningTime);
        var allowedLocal = ApplyQuietHours(localDateTime, quietHoursStart, quietHoursEnd);
        var unspecifiedLocal = DateTime.SpecifyKind(allowedLocal, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecifiedLocal, timeZone);
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

        // Overnight quiet period (e.g. 22:00 -> 07:00)
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
                // Fall back
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
