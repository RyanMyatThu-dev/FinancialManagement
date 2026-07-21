using System;
using System.Threading.Tasks;
using ST_finance.Domain.Features.Authentication.Models;
using ST_finance.Shared;

namespace ST_finance.Domain.Features.Authentication
{
    public interface IAuthService
    {
        Task<Result> SendRegisterOtpAsync(string email);
        Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request);
        Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
        Task<Result<AuthResponse>> VerifyTwoFactorAsync(VerifyTwoFactorRequest request);
        Task<Result<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request);
        Task<Result<UserProfileResponse>> GetProfileAsync(Guid userId);
        Task<Result<UserProfileResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
        Task<Result> UpdateUsernameAsync(Guid userId, string newUsername);
        Task<Result> RequestPasswordChangeAsync(Guid userId, ChangePasswordRequest request);
        Task<Result> ChangePasswordAsync(Guid userId, ConfirmPasswordChangeRequest request);
        Task<Result> RequestEmailChangeAsync(Guid userId, string newEmail);
        Task<Result> VerifyCurrentEmailAsync(Guid userId, VerifyCurrentEmailRequest request);
        Task<Result> ConfirmEmailChangeAsync(Guid userId, ConfirmEmailChangeRequest request);
        Task<Result> ToggleTwoFactorAsync(Guid userId, Toggle2FaRequest request);
        Task<Result> DeleteUserAsync(Guid userId);
        Task<Result> SendForgotPasswordOtpAsync(string email);
        Task<Result> ResetPasswordAsync(ResetPasswordRequest request);
    }
}
