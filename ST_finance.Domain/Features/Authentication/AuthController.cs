using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Authentication.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Authentication
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ApiControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("seed")]
        [AllowAnonymous]
        public async Task<IActionResult> SeedDatabase(
            [FromServices] UserManager<TblUser> userManager,
            [FromServices] AppDbContext context)
        {
            try
            {
                await DbSeeder.SeedAsync(userManager, context);
                return Ok(Result.Success(new { message = "Database seeded successfully with 2 test students." }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, Result.Failure(new Error("Database.SeedFailed", ex.Message)));
            }
        }

        [HttpPost("register/send-otp")]
        [AllowAnonymous]
        public async Task<IActionResult> SendRegisterOtp([FromBody] RegisterSendOtpRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var result = await _authService.SendRegisterOtpAsync(request.Email);
            return HandleResult(result);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var result = await _authService.RegisterAsync(request);
            return HandleResult(result);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var result = await _authService.LoginAsync(request);
            return HandleResult(result);
        }

        [HttpPost("login/verify-2fa")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var result = await _authService.VerifyTwoFactorAsync(request);
            return HandleResult(result);
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var result = await _authService.RefreshTokenAsync(request);
            return HandleResult(result);
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            var result = await _authService.GetProfileAsync(userId);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure<UserProfileResponse>(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _authService.UpdateProfileAsync(userId, request);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("profile/update-username")]
        public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _authService.UpdateUsernameAsync(userId, request.NewUsername);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("profile/change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _authService.ChangePasswordAsync(userId, request);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("profile/request-email-change")]
        public async Task<IActionResult> RequestEmailChange([FromBody] RequestEmailChangeRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _authService.RequestEmailChangeAsync(userId, request.NewEmail);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("profile/confirm-email-change")]
        public async Task<IActionResult> ConfirmEmailChange([FromBody] ConfirmEmailChangeRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _authService.ConfirmEmailChangeAsync(userId, request);
            return HandleResult(result);
        }

        [Authorize]
        [HttpPost("profile/toggle-2fa")]
        public async Task<IActionResult> ToggleTwoFactor([FromBody] Toggle2FaRequest request)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                return BadRequest(Result.Failure(CustomErrors.Validation.InvalidInput(errors)));
            }

            var userId = GetUserId();
            var result = await _authService.ToggleTwoFactorAsync(userId, request);
            return HandleResult(result);
        }

        [Authorize]
        [HttpDelete("profile")]
        public async Task<IActionResult> DeactivateAccount()
        {
            var userId = GetUserId();
            var result = await _authService.DeleteUserAsync(userId);
            return HandleResult(result);
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                throw new UnauthorizedAccessException("User ID claim missing or invalid in JWT token.");
            }
            return userId;
        }
    }
}
