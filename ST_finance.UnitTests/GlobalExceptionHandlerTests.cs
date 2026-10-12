using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using ST_finance.Domain;
using Xunit;

namespace ST_finance.UnitTests
{
    public class GlobalExceptionHandlerTests
    {
        private readonly GlobalExceptionHandler _handler = new(NullLogger<GlobalExceptionHandler>.Instance);

        private static async Task<(int StatusCode, JsonDocument Body)> InvokeAsync(Exception exception)
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            var handler = new GlobalExceptionHandler(NullLogger<GlobalExceptionHandler>.Instance);
            var handled = await handler.TryHandleAsync(context, exception, CancellationToken.None);
            Assert.True(handled);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var json = await reader.ReadToEndAsync();
            return (context.Response.StatusCode, JsonDocument.Parse(json));
        }

        [Fact]
        public async Task TryHandleAsync_UnauthorizedAccessException_Returns401WithAuthUnauthorizedCode()
        {
            var (statusCode, body) = await InvokeAsync(new UnauthorizedAccessException("User ID claim missing or invalid in JWT token."));

            Assert.Equal(StatusCodes.Status401Unauthorized, statusCode);
            Assert.False(body.RootElement.GetProperty("isSuccess").GetBoolean());
            Assert.Equal("Auth.Unauthorized", body.RootElement.GetProperty("error").GetProperty("code").GetString());
        }

        [Fact]
        public async Task TryHandleAsync_UnknownException_Returns500WithGeneralUnexpectedErrorCode()
        {
            var (statusCode, body) = await InvokeAsync(new InvalidOperationException("something else broke"));

            Assert.Equal(StatusCodes.Status500InternalServerError, statusCode);
            Assert.False(body.RootElement.GetProperty("isSuccess").GetBoolean());
            Assert.Equal("General.UnexpectedError", body.RootElement.GetProperty("error").GetProperty("code").GetString());
        }

        [Fact]
        public async Task TryHandleAsync_AlwaysReturnsTrue_SoNoExceptionEscapesTheHandler()
        {
            var (handled, _) = (await InvokeAsync(new Exception("anything")), (object?)null);
            // InvokeAsync already asserts handled == true via Assert.True inside it;
            // this test exists to document the contract explicitly for future readers.
            Assert.True(true);
        }
    }
}
