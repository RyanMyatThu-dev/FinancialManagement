using System;

namespace ST_finance.Shared
{
    /// <summary>
    /// Converts between UTC (as stored/queried in the database) and the app's fixed
    /// Bangkok (UTC+7) display/business timezone. Bangkok does not observe DST, so a
    /// fixed offset is correct here — this is not a general-purpose timezone converter.
    /// </summary>
    public static class BkkTimeHelper
    {
        private const int OffsetHours = 7;

        public static DateTime ToBkk(DateTime utc) => utc.AddHours(OffsetHours);

        public static DateTime StartOfDayUtc(int year, int month, int day)
            => DateTime.SpecifyKind(
                new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc).AddHours(-OffsetHours),
                DateTimeKind.Utc);

        public static DateTime StartOfDayUtc(DateTime bkkDate)
            => StartOfDayUtc(bkkDate.Year, bkkDate.Month, bkkDate.Day);

        public static DateTime EndOfDayUtc(int year, int month, int day)
            => DateTime.SpecifyKind(
                new DateTime(year, month, day, 23, 59, 59, DateTimeKind.Utc).AddMilliseconds(999).AddHours(-OffsetHours),
                DateTimeKind.Utc);

        public static DateTime StartOfMonthUtc(int year, int month)
            => DateTime.SpecifyKind(
                new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-OffsetHours),
                DateTimeKind.Utc);

        public static DateTime StartOfYearUtc(int year)
            => DateTime.SpecifyKind(
                new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(-OffsetHours),
                DateTimeKind.Utc);

        public static DateTime StartOfWeekUtc(DateTime currentBkk)
        {
            var diff = (7 + (currentBkk.DayOfWeek - DayOfWeek.Monday)) % 7;
            var startOfWeekBkk = currentBkk.AddDays(-1 * diff);
            return StartOfDayUtc(startOfWeekBkk.Year, startOfWeekBkk.Month, startOfWeekBkk.Day);
        }
    }
}
