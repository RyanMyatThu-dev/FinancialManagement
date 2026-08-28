using System;
using System.Security.Claims;
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

        /// <summary>
        /// Extracts the authenticated user's id from the JWT's NameIdentifier/sub claim.
        /// Throws if the claim is missing or malformed — under [Authorize], this should
        /// only happen if the token was tampered with or claim mapping is misconfigured.
        /// </summary>
        protected Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                throw new UnauthorizedAccessException("User ID claim missing or invalid in JWT token.");
            }
            return userId;
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
