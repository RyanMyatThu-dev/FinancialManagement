using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Authentication.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Authentication
{
    public class AuthService : IAuthService
    {
        private const int OtpExpiryMinutes = 10;

        private readonly UserManager<TblUser> _userManager;
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AuthService(
            UserManager<TblUser> userManager,
            AppDbContext context,
            ITokenService tokenService,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _context = context;
            _tokenService = tokenService;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<Result> SendRegisterOtpAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("Email is required."));
            }

            var existingEmail = await _userManager.FindByEmailAsync(email);
            if (existingEmail != null)
            {
                return Result.Failure(CustomErrors.Auth.EmailAlreadyRegistered);
            }

            await GenerateAndSendOtpAsync(email, "Register");
            return Result.Success();
        }

        public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request)
        {
            if (request == null)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var otpValid = await ValidateOtpAsync(request.Email, request.OtpCode, "Register");
            if (!otpValid)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Auth.InvalidOtp);
            }

            var existingEmail = await _userManager.FindByEmailAsync(request.Email);
            if (existingEmail != null)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Auth.EmailAlreadyRegistered);
            }

            var existingUsername = await _userManager.FindByNameAsync(request.Username);
            if (existingUsername != null)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput("Username is already taken."));
            }

            var user = new TblUser
            {
                UserName = request.Username,
                Email = request.Email,
                FullName = request.FullName,
                EmailConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString(),
                DeleteFlag = false
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return Result.Failure<AuthResponse>(new Error("Auth.RegistrationFailed", $"User registration failed: {errors}"));
            }

            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                MonthlyAllowanceAmount = 16000.00m,
                AllowanceDayOfMonth = 25,
                TargetMonthlySavings = 2000.00m,
                Currency = string.IsNullOrEmpty(request.Currency) ? "THB" : request.Currency,
                EnableQuotaPacing = true,
                UpdatedAt = DateTime.UtcNow
            };

            _context.TblUserProfiles.Add(profile);
            await _context.SaveChangesAsync();

            return await BuildAuthResponseAsync(user);
        }

        public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
        {
            if (request == null)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            {
                return Result.Failure<AuthResponse>(CustomErrors.Auth.InvalidCredentials);
            }

            if (user.TwoFactorEnabled)
            {
                await GenerateAndSendOtpAsync(user.Email!, "TwoFactor");

                return Result.Success(new AuthResponse(
                    AccessToken: null,
                    RefreshToken: null,
                    UserId: user.Id,
                    Username: user.UserName!,
                    Email: user.Email!,
                    FullName: user.FullName ?? string.Empty,
                    Expiration: null,
                    IsTwoFactorRequired: true
                ));
            }

            return await BuildAuthResponseAsync(user);
        }

        public async Task<Result<AuthResponse>> VerifyTwoFactorAsync(VerifyTwoFactorRequest request)
        {
            if (request == null)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user == null)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Auth.UserNotFound);
            }

            if (!user.TwoFactorEnabled)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput("Two-factor authentication is not enabled for this account."));
            }

            var otpValid = await ValidateOtpAsync(user.Email!, request.OtpCode, "TwoFactor");
            if (!otpValid)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Auth.InvalidOtp);
            }

            return await BuildAuthResponseAsync(user);
        }

        public async Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
        {
            if (request == null)
            {
                return Result.Failure<AuthResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            try
            {
                var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier) ?? principal.FindFirst("sub");
                
                if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
                {
                    return Result.Failure<AuthResponse>(CustomErrors.Auth.RefreshTokenExpired);
                }

                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                {
                    return Result.Failure<AuthResponse>(CustomErrors.Auth.RefreshTokenExpired);
                }

                return await BuildAuthResponseAsync(user);
            }
            catch
            {
                return Result.Failure<AuthResponse>(CustomErrors.Auth.RefreshTokenExpired);
            }
        }

        public async Task<Result<UserProfileResponse>> GetProfileAsync(Guid userId)
        {
            var user = await _userManager.Users
                .Include(u => u.TblUserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return Result.Failure<UserProfileResponse>(CustomErrors.Auth.UserNotFound);
            }

            return Result.Success(await BuildUserProfileResponseAsync(user));
        }

        public async Task<Result<UserProfileResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            if (request == null)
            {
                return Result.Failure<UserProfileResponse>(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var user = await _userManager.Users
                .Include(u => u.TblUserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return Result.Failure<UserProfileResponse>(CustomErrors.Auth.UserNotFound);
            }

            var profile = user.TblUserProfile;

            if (profile == null)
            {
                profile = new TblUserProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    MonthlyAllowanceAmount = 16000.00m,
                    AllowanceDayOfMonth = 25,
                    TargetMonthlySavings = 2000.00m,
                    Currency = "THB",
                    ResetFrequency = "Monthly",
                    EnableQuotaPacing = true
                };
                _context.TblUserProfiles.Add(profile);
            }

            if (request.MonthlyAllowanceAmount.HasValue)
            {
                profile.MonthlyAllowanceAmount = request.MonthlyAllowanceAmount.Value;
            }

            if (!string.IsNullOrEmpty(request.ResetFrequency))
            {
                var freq = request.ResetFrequency;
                if (freq != "Monthly" && freq != "Weekly" && freq != "None")
                {
                    return Result.Failure<UserProfileResponse>(CustomErrors.Validation.InvalidInput("Reset frequency must be 'Monthly', 'Weekly', or 'None'."));
                }
                profile.ResetFrequency = freq;

                if (freq == "Weekly" && (profile.AllowanceDayOfMonth < 1 || profile.AllowanceDayOfMonth > 7))
                {
                    profile.AllowanceDayOfMonth = 1; // Default to Monday
                }
            }

            var activeFreq = profile.ResetFrequency ?? "Monthly";

            if (request.AllowanceDayOfMonth.HasValue)
            {
                int val = request.AllowanceDayOfMonth.Value;
                if (activeFreq == "Weekly")
                {
                    if (val < 1 || val > 7)
                    {
                        return Result.Failure<UserProfileResponse>(CustomErrors.Validation.InvalidInput("Weekly allowance reset day must be between 1 (Monday) and 7 (Sunday)."));
                    }
                }
                else if (activeFreq == "Monthly")
                {
                    if (val < 1 || val > 31)
                    {
                        return Result.Failure<UserProfileResponse>(CustomErrors.Validation.InvalidInput("Monthly allowance reset day must be between 1 and 31."));
                    }
                }
                profile.AllowanceDayOfMonth = val;
            }

            if (request.TargetMonthlySavings.HasValue)
            {
                profile.TargetMonthlySavings = request.TargetMonthlySavings.Value;
            }

            if (!string.IsNullOrEmpty(request.Currency))
            {
                profile.Currency = request.Currency;
            }

            if (request.EnableQuotaPacing.HasValue)
            {
                profile.EnableQuotaPacing = request.EnableQuotaPacing.Value;
            }

            profile.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Result.Success(await BuildUserProfileResponseAsync(user));
        }

        public async Task<Result> UpdateUsernameAsync(Guid userId, string newUsername)
        {
            if (string.IsNullOrWhiteSpace(newUsername))
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("Username is required."));
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return Result.Failure(CustomErrors.Auth.UserNotFound);
            }

            var existing = await _userManager.FindByNameAsync(newUsername);
            if (existing != null && existing.Id != userId)
            {
                return Result.Failure(CustomErrors.Auth.UsernameInUse);
            }

            user.UserName = newUsername;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return Result.Failure(new Error("Auth.UpdateFailed", errors));
            }

            return Result.Success();
        }

        public async Task<Result> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
        {
            if (request == null)
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return Result.Failure(CustomErrors.Auth.UserNotFound);
            }

            if (!await _userManager.CheckPasswordAsync(user, request.CurrentPassword))
            {
                return Result.Failure(CustomErrors.Auth.IncorrectPassword);
            }

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return Result.Failure(new Error("Auth.PasswordChangeFailed", errors));
            }

            return Result.Success();
        }

        public async Task<Result> RequestEmailChangeAsync(Guid userId, string newEmail)
        {
            if (string.IsNullOrWhiteSpace(newEmail))
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("New email is required."));
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return Result.Failure(CustomErrors.Auth.UserNotFound);
            }

            if (string.Equals(user.Email, newEmail, StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("New email must be different from your current email."));
            }

            var existing = await _userManager.FindByEmailAsync(newEmail);
            if (existing != null)
            {
                return Result.Failure(CustomErrors.Auth.EmailInUse);
            }

            await GenerateAndSendOtpAsync(newEmail, "EmailChange");
            return Result.Success();
        }

        public async Task<Result> ConfirmEmailChangeAsync(Guid userId, ConfirmEmailChangeRequest request)
        {
            if (request == null)
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return Result.Failure(CustomErrors.Auth.UserNotFound);
            }

            var otpValid = await ValidateOtpAsync(request.NewEmail, request.OtpCode, "EmailChange");
            if (!otpValid)
            {
                return Result.Failure(CustomErrors.Auth.InvalidOtp);
            }

            var existing = await _userManager.FindByEmailAsync(request.NewEmail);
            if (existing != null && existing.Id != userId)
            {
                return Result.Failure(CustomErrors.Auth.EmailInUse);
            }

            user.Email = request.NewEmail;
            user.NormalizedEmail = _userManager.NormalizeEmail(request.NewEmail);
            user.EmailConfirmed = true;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return Result.Failure(new Error("Auth.EmailChangeFailed", errors));
            }

            return Result.Success();
        }

        public async Task<Result> ToggleTwoFactorAsync(Guid userId, Toggle2FaRequest request)
        {
            if (request == null)
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput("Request cannot be null."));
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return Result.Failure(CustomErrors.Auth.UserNotFound);
            }

            if (string.IsNullOrWhiteSpace(request.OtpCode))
            {
                await GenerateAndSendOtpAsync(user.Email!, "TwoFactor");
                return Result.Success();
            }

            var otpValid = await ValidateOtpAsync(user.Email!, request.OtpCode, "TwoFactor");
            if (!otpValid)
            {
                return Result.Failure(CustomErrors.Auth.InvalidOtp);
            }

            if (request.Enable == user.TwoFactorEnabled)
            {
                return Result.Failure(CustomErrors.Validation.InvalidInput(
                    request.Enable ? "Two-factor authentication is already enabled." : "Two-factor authentication is already disabled."));
            }

            user.TwoFactorEnabled = request.Enable;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return Result.Failure(new Error("Auth.TwoFactorToggleFailed", errors));
            }

            return Result.Success();
        }

        public async Task<Result> DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return Result.Failure(CustomErrors.Auth.UserNotFound);
            }

            user.DeleteFlag = true;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                return Result.Failure(new Error("Auth.DeactivateFailed", $"Failed to soft delete user: {errors}"));
            }

            return Result.Success();
        }

        private async Task GenerateAndSendOtpAsync(string email, string purpose)
        {
            var existingOtps = await _context.TblOtpVerifications
                .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed)
                .ToListAsync();

            foreach (var otp in existingOtps)
            {
                otp.IsUsed = true;
            }

            var code = GenerateOtpCode();
            var otpEntry = new TblOtpVerification
            {
                Id = Guid.NewGuid(),
                Email = email,
                Code = code,
                Purpose = purpose,
                ExpiryTime = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes),
                IsUsed = false
            };

            _context.TblOtpVerifications.Add(otpEntry);
            await _context.SaveChangesAsync();

            await _emailService.SendOtpEmailAsync(email, code, purpose);
        }

        private async Task<bool> ValidateOtpAsync(string email, string code, string purpose)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return false;
            }

            var otp = await _context.TblOtpVerifications
                .Where(o => o.Email == email && o.Purpose == purpose && !o.IsUsed && o.ExpiryTime > DateTime.UtcNow)
                .OrderByDescending(o => o.ExpiryTime)
                .FirstOrDefaultAsync();

            if (otp == null || otp.Code != code.Trim())
            {
                return false;
            }

            otp.IsUsed = true;
            await _context.SaveChangesAsync();
            return true;
        }

        private static string GenerateOtpCode()
        {
            return Random.Shared.Next(100000, 999999).ToString();
        }

        private async Task<Result<AuthResponse>> BuildAuthResponseAsync(TblUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Student";
            var permissions = await _context.TblRolePermissions
                .Join(_context.Roles, rp => rp.RoleId, r => r.Id, (rp, r) => new { rp.Permission, RoleName = r.Name })
                .Where(x => roles.Contains(x.RoleName))
                .Select(x => x.Permission)
                .Distinct()
                .ToListAsync();

            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();

            var jwtSettings = _configuration.GetSection("JwtSettings");
            var accessTokenExpiryMinutes = double.Parse(jwtSettings["AccessTokenExpiryMinutes"] ?? "1440");
            var refreshTokenExpiryDays = double.Parse(jwtSettings["RefreshTokenExpiryDays"] ?? "30");

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(refreshTokenExpiryDays);
            await _userManager.UpdateAsync(user);

            var expiration = DateTime.UtcNow.AddMinutes(accessTokenExpiryMinutes);

            return Result.Success(new AuthResponse(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                UserId: user.Id,
                Username: user.UserName!,
                Email: user.Email!,
                FullName: user.FullName ?? string.Empty,
                Expiration: expiration,
                IsTwoFactorRequired: false,
                Role: role,
                Permissions: permissions
            ));
        }

        private async Task<UserProfileResponse> BuildUserProfileResponseAsync(TblUser user)
        {
            var profile = user.TblUserProfile;
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Student";
            var permissions = await _context.TblRolePermissions
                .Join(_context.Roles, rp => rp.RoleId, r => r.Id, (rp, r) => new { rp.Permission, RoleName = r.Name })
                .Where(x => roles.Contains(x.RoleName))
                .Select(x => x.Permission)
                .Distinct()
                .ToListAsync();

            return new UserProfileResponse(
                UserId: user.Id,
                Username: user.UserName!,
                Email: user.Email!,
                FullName: user.FullName ?? string.Empty,
                EmailConfirmed: user.EmailConfirmed,
                TwoFactorEnabled: user.TwoFactorEnabled,
                MonthlyAllowanceAmount: profile?.MonthlyAllowanceAmount,
                AllowanceDayOfMonth: profile?.AllowanceDayOfMonth,
                TargetMonthlySavings: profile?.TargetMonthlySavings,
                Currency: profile?.Currency,
                ResetFrequency: profile?.ResetFrequency,
                EnableQuotaPacing: profile == null || profile.EnableQuotaPacing,
                UpdatedAt: profile?.UpdatedAt,
                Role: role,
                Permissions: permissions
            );
        }
    }
}
