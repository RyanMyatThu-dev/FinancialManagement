using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ST_finance.Shared;

namespace ST_finance.Domain
{
    /// <summary>
    /// Catches any exception that escapes MVC action execution and converts it into the
    /// same Result-based JSON envelope every other API response already uses, so a client
    /// never has to distinguish "handled failure" from "unhandled exception" by shape.
    /// Without this, an UnauthorizedAccessException thrown by ApiControllerBase.GetUserId()
    /// (e.g. from a malformed JWT claim) surfaces as a bare unhandled 500 instead of a 401.
    /// </summary>
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            var (statusCode, result) = exception switch
            {
                UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, Result.Failure(CustomErrors.Auth.Unauthorized)),
                _ => (StatusCodes.Status500InternalServerError, Result.Failure(CustomErrors.General.UnexpectedError))
            };

            _logger.LogError(exception, "Unhandled exception processing {Method} {Path}",
                httpContext.Request.Method, httpContext.Request.Path);

            httpContext.Response.StatusCode = statusCode;
            await httpContext.Response.WriteAsJsonAsync(result, cancellationToken);

            return true;
        }
    }
}
