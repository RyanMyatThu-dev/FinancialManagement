using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ST_finance.Shared;

namespace ST_finance.Domain.Features
{
    [ApiController]
    [EnableRateLimiting("api-general")]
    public abstract class ApiControllerBase : ControllerBase
    {
        protected IActionResult HandleResult(Result result)
        {
            if (result.IsSuccess)
            {
                return Ok(result);
            }

            return MapErrorToResponse(result);
        }

        protected IActionResult HandleResult<T>(Result<T> result)
        {
            if (result.IsSuccess)
            {
                return Ok(result);
            }

            return MapErrorToResponse(result);
        }

        private IActionResult MapErrorToResponse(Result result)
        {
            var error = result.Error;
            if (error.Code.Contains("NotFound"))
            {
                return NotFound(result);
            }
            if (error.Code.Contains("Unauthorized") || error.Code.Contains("InvalidCredentials"))
            {
                return Unauthorized(result);
            }
            return BadRequest(result);
        }
    }
}
