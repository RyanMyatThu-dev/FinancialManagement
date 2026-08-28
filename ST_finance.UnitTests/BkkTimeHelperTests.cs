using System;
using ST_finance.Shared;
using Xunit;

namespace ST_finance.UnitTests
{
    public class BkkTimeHelperTests
    {
        [Fact]
        public void ToBkk_AddsSevenHours()
        {
            var utc = new DateTime(2026, 7, 15, 10, 0, 0, DateTimeKind.Utc);
            var result = BkkTimeHelper.ToBkk(utc);
            Assert.Equal(new DateTime(2026, 7, 15, 17, 0, 0, DateTimeKind.Utc), result);
        }

        [Fact]
        public void StartOfDayUtc_FromYearMonthDay_ConvertsBkkMidnightToUtc()
        {
            // BKK midnight on 16 July 2026 is 17:00 UTC on 15 July 2026
            var result = BkkTimeHelper.StartOfDayUtc(2026, 7, 16);
            Assert.Equal(new DateTime(2026, 7, 15, 17, 0, 0, DateTimeKind.Utc), result);
            Assert.Equal(DateTimeKind.Utc, result.Kind);
        }

        [Fact]
        public void StartOfDayUtc_FromDateTimeOverload_MatchesYearMonthDayOverload()
        {
            var bkkDate = new DateTime(2026, 7, 16, 13, 45, 0, DateTimeKind.Utc);
            var result = BkkTimeHelper.StartOfDayUtc(bkkDate);
            Assert.Equal(BkkTimeHelper.StartOfDayUtc(2026, 7, 16), result);
        }

        [Fact]
        public void EndOfDayUtc_IsOneMillisecondBeforeNextDayStart()
        {
            var result = BkkTimeHelper.EndOfDayUtc(2026, 7, 16);
            Assert.Equal(new DateTime(2026, 7, 16, 16, 59, 59, 999, DateTimeKind.Utc), result);
            Assert.Equal(DateTimeKind.Utc, result.Kind);
        }

        [Fact]
        public void StartOfMonthUtc_ConvertsBkkFirstOfMonthToUtc()
        {
            // Matches BudgetServiceTests' pinned comment: BKK 2026-07-01 00:00 == UTC 2026-06-30 17:00
            var result = BkkTimeHelper.StartOfMonthUtc(2026, 7);
            Assert.Equal(new DateTime(2026, 6, 30, 17, 0, 0, DateTimeKind.Utc), result);
        }

        [Fact]
        public void StartOfYearUtc_ConvertsBkkJan1ToUtc()
        {
            var result = BkkTimeHelper.StartOfYearUtc(2026);
            Assert.Equal(new DateTime(2025, 12, 31, 17, 0, 0, DateTimeKind.Utc), result);
        }

        [Fact]
        public void StartOfWeekUtc_FromWednesday_ReturnsPrecedingMonday()
        {
            // 2026-07-15 is a Wednesday
            var wednesdayBkk = new DateTime(2026, 7, 15, 9, 30, 0, DateTimeKind.Utc);
            var result = BkkTimeHelper.StartOfWeekUtc(wednesdayBkk);
            Assert.Equal(BkkTimeHelper.StartOfDayUtc(2026, 7, 13), result); // Monday 2026-07-13
        }

        [Fact]
        public void StartOfWeekUtc_FromMonday_ReturnsSameDay()
        {
            // 2026-07-13 is a Monday
            var mondayBkk = new DateTime(2026, 7, 13, 9, 30, 0, DateTimeKind.Utc);
            var result = BkkTimeHelper.StartOfWeekUtc(mondayBkk);
            Assert.Equal(BkkTimeHelper.StartOfDayUtc(2026, 7, 13), result);
        }

        [Fact]
        public void StartOfWeekUtc_FromSunday_ReturnsPrecedingMonday()
        {
            // 2026-07-19 is a Sunday; preceding Monday is 2026-07-13
            var sundayBkk = new DateTime(2026, 7, 19, 9, 30, 0, DateTimeKind.Utc);
            var result = BkkTimeHelper.StartOfWeekUtc(sundayBkk);
            Assert.Equal(BkkTimeHelper.StartOfDayUtc(2026, 7, 13), result);
        }
    }
}
