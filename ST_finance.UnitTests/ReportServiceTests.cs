using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Reports;
using ST_finance.Domain.Features.Reports.Models;
using Xunit;

namespace ST_finance.UnitTests
{
    public class ReportServiceTests
    {
        private readonly AppDbContext _context;
        private readonly ReportService _service;
        private readonly Guid _userId = Guid.NewGuid();

        public ReportServiceTests()
        {
            _context = TestDatabaseFixture.CreateContext();
            _service = new ReportService(_context);
        }

        [Fact]
        public async Task SubmitReportAsync_CreatesReportWithOpenStatus()
        {
            var request = new SubmitReportRequest("Login bug", "Sometimes I get stuck on the login screen.");

            var result = await _service.SubmitReportAsync(_userId, request);

            Assert.True(result.IsSuccess);
            Assert.Equal("Login bug", result.Value.Title);
            Assert.Equal("Sometimes I get stuck on the login screen.", result.Value.Description);
            Assert.Equal("Open", result.Value.Status);

            var stored = await _context.TblUserReports.FirstOrDefaultAsync(r => r.Id == result.Value.Id);
            Assert.NotNull(stored);
            Assert.Equal(_userId, stored!.UserId);
            Assert.False(stored.DeleteFlag);
        }

        [Fact]
        public async Task SubmitReportAsync_NullRequest_ReturnsFailure()
        {
            var result = await _service.SubmitReportAsync(_userId, null!);

            Assert.True(result.IsFailure);
        }
    }
}
