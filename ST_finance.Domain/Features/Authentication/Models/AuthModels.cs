using System;
using System.ComponentModel.DataAnnotations;

namespace ST_finance.Domain.Features.Authentication.Models;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string Username,
    [Required] string FullName,
    [Required] string OtpCode
);

public record RegisterSendOtpRequest(
    [Required][EmailAddress] string Email
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string? AccessToken,
    string? RefreshToken,
    Guid UserId,
    string Username,
    string Email,
    string FullName,
    DateTime? Expiration,
    bool IsTwoFactorRequired = false
);

public record VerifyTwoFactorRequest(
    [Required] Guid UserId,
    [Required] string OtpCode
);

public record RefreshTokenRequest(
    [Required] string AccessToken,
    [Required] string RefreshToken
);

public record UserProfileResponse(
    Guid UserId,
    string Username,
    string Email,
    string FullName,
    bool EmailConfirmed,
    bool TwoFactorEnabled,
    decimal? MonthlyAllowanceAmount,
    int? AllowanceDayOfMonth,
    decimal? TargetMonthlySavings,
    string? Currency,
    DateTime? UpdatedAt
);

public record UpdateProfileRequest(
    decimal? MonthlyAllowanceAmount,
    int? AllowanceDayOfMonth,
    decimal? TargetMonthlySavings,
    string? Currency
);

public record UpdateUsernameRequest(
    [Required] string NewUsername
);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required][MinLength(6)] string NewPassword
);

public record RequestEmailChangeRequest(
    [Required][EmailAddress] string NewEmail
);

public record ConfirmEmailChangeRequest(
    [Required][EmailAddress] string NewEmail,
    [Required] string OtpCode
);

public record Toggle2FaRequest(
    bool Enable,
    string? OtpCode = null
);
