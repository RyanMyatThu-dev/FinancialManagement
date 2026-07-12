using System;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Authentication.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Authentication
{
    public interface IAuthService
    {
        Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
        Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
        Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
        Task<Result<UserProfileResponse>> GetProfileAsync(Guid userId);
        Task<Result<UserProfileResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task<Result> DeleteUserAsync(Guid userId);
    }
}