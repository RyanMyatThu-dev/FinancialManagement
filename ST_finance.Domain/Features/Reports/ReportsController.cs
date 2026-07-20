using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Database.Data;
using ST_finance.Shared;
using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ST_finance.Domain.Features.Reports
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ApiControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] SubmitReportRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized(Result.Failure(CustomErrors.Auth.UserNotFound));
            }

            var report = new TblUserReport
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                Status = "Open",
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblUserReports.Add(report);
            await _context.SaveChangesAsync();

            return Ok(Result.Success(new
            {
                report.Id,
                report.Title,
                report.Description,
                report.Status,
                report.CreatedAt
            }));
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId) ? userId : Guid.Empty;
        }
    }

    public record SubmitReportRequest(
        [Required][MaxLength(150)] string Title,
        [Required][MaxLength(1000)] string Description
    );
}
