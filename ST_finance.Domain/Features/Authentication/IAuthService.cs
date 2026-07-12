using System;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Authentication.Models;

namespace ST_finance.Domain.Features.Authentication
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
        Task<UserProfileResponse> GetProfileAsync(Guid userId);
        Task<UserProfileResponse> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task DeleteUserAsync(Guid userId);
    }
}