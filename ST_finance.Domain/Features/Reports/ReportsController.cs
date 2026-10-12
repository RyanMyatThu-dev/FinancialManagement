using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Domain.Features.Reports.Models;
using ST_finance.Shared;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace ST_finance.Domain.Features.Reports
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ApiControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] SubmitReportHttpRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _reportService.SubmitReportAsync(userId, new SubmitReportRequest(request.Title, request.Description));
            return HandleResult(result);
        }
    }

    public record SubmitReportHttpRequest(
        [Required][MaxLength(150)] string Title,
        [Required][MaxLength(1000)] string Description
    );
}
