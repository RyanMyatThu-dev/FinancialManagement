using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Authentication.Models;

namespace ST_finance.Domain.Features.Authentication
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<TblUser> _userManager;
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthService(
            UserManager<TblUser> userManager,
            AppDbContext context,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _context = context;
            _tokenService = tokenService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            
            var existingEmail = await _userManager.FindByEmailAsync(request.Email);
            if (existingEmail != null)
            {
                throw new ArgumentException("Email is already registered.");
            }

            var existingUsername = await _userManager.FindByNameAsync(request.Username);
            if (existingUsername != null)
            {
                throw new ArgumentException("Username is already taken.");
            }

            
            var user = new TblUser
            {
                UserName = request.Username,
                Email = request.Email,
                FullName = request.FullName,
                SecurityStamp = Guid.NewGuid().ToString()
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new ArgumentException($"User registration failed: {errors}");
            }

            
            var profile = new TblUserProfile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                MonthlyAllowanceAmount = 16000.00m,
                AllowanceDayOfMonth = 25,
                TargetMonthlySavings = 2000.00m,
                Currency = "THB",
                UpdatedAt = DateTime.UtcNow
            };

            _context.TblUserProfiles.Add(profile);
            await _context.SaveChangesAsync();

            
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            var expiration = DateTime.UtcNow.AddMinutes(60);

            return new AuthResponse(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                UserId: user.Id,
                Username: user.UserName!,
                Email: user.Email!,
                FullName: user.FullName ?? string.Empty,
                Expiration: expiration
            );
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            
            var accessToken = _tokenService.GenerateAccessToken(user);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            var expiration = DateTime.UtcNow.AddMinutes(60);

            return new AuthResponse(
                AccessToken: accessToken,
                RefreshToken: refreshToken,
                UserId: user.Id,
                Username: user.UserName!,
                Email: user.Email!,
                FullName: user.FullName ?? string.Empty,
                Expiration: expiration
            );
        }

        public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
        {
            
            var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier) ?? principal.FindFirst("sub");
            
            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                throw new SecurityTokenException("Invalid access token claims.");
            }

            
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                throw new SecurityTokenException("Invalid or expired refresh token.");
            }

            var newAccessToken = _tokenService.GenerateAccessToken(user);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            var expiration = DateTime.UtcNow.AddMinutes(60);

            return new AuthResponse(
                AccessToken: newAccessToken,
                RefreshToken: newRefreshToken,
                UserId: user.Id,
                Username: user.UserName!,
                Email: user.Email!,
                FullName: user.FullName ?? string.Empty,
                Expiration: expiration
            );
        }

        public async Task<UserProfileResponse> GetProfileAsync(Guid userId)
        {
            var user = await _userManager.Users
                .Include(u => u.TblUserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var profile = user.TblUserProfile;

            return new UserProfileResponse(
                UserId: user.Id,
                Username: user.UserName!,
                Email: user.Email!,
                FullName: user.FullName ?? string.Empty,
                MonthlyAllowanceAmount: profile?.MonthlyAllowanceAmount,
                AllowanceDayOfMonth: profile?.AllowanceDayOfMonth,
                TargetMonthlySavings: profile?.TargetMonthlySavings,
                Currency: profile?.Currency,
                UpdatedAt: profile?.UpdatedAt
            );
        }

        public async Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var user = await _userManager.Users
                .Include(u => u.TblUserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found.");
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
                    Currency = "THB"
                };
                _context.TblUserProfiles.Add(profile);
            }

            if (request.MonthlyAllowanceAmount.HasValue)
            {
                profile.MonthlyAllowanceAmount = request.MonthlyAllowanceAmount.Value;
            }

            if (request.AllowanceDayOfMonth.HasValue)
            {
                int val = request.AllowanceDayOfMonth.Value;
                if (val < 1 || val > 31)
                {
                    throw new ArgumentException("Allowance cycle day must be between 1 and 31.");
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

            profile.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new UserProfileResponse(
                UserId: user.Id,
                Username: user.UserName!,
                Email: user.Email!,
                FullName: user.FullName ?? string.Empty,
                MonthlyAllowanceAmount: profile.MonthlyAllowanceAmount,
                AllowanceDayOfMonth: profile.AllowanceDayOfMonth,
                TargetMonthlySavings: profile.TargetMonthlySavings,
                Currency: profile.Currency,
                UpdatedAt: profile.UpdatedAt
            );
        }

        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            user.DeleteFlag = true;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to soft delete user: {errors}");
            }
        }
    }
}