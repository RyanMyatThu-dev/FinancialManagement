using System;
using System.ComponentModel.DataAnnotations;

namespace ST_finance.Domain.Features.Authentication.Models;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string Username,
    [Required] string FullName,
    [Required] string OtpCode,
    string? Currency = "THB"
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
    bool IsTwoFactorRequired = false,
    string? Role = null,
    System.Collections.Generic.List<string>? Permissions = null
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
    string? ResetFrequency,
    bool? EnableQuotaPacing,
    DateTime? UpdatedAt,
    string? Role = null,
    System.Collections.Generic.List<string>? Permissions = null
);

public record UpdateProfileRequest(
    decimal? MonthlyAllowanceAmount,
    int? AllowanceDayOfMonth,
    decimal? TargetMonthlySavings,
    string? Currency,
    string? ResetFrequency,
    bool? EnableQuotaPacing
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

public record ForgotPasswordSendOtpRequest(
    [Required][EmailAddress] string Email
);

public record ResetPasswordRequest(
    [Required][EmailAddress] string Email,
    [Required] string OtpCode,
    [Required][MinLength(6)] string NewPassword
);

public record VerifyCurrentEmailRequest(
    [Required][EmailAddress] string NewEmail,
    [Required] string OtpCode
);

public record ConfirmPasswordChangeRequest(
    [Required] string CurrentPassword,
    [Required][MinLength(6)] string NewPassword,
    [Required] string OtpCode
);
