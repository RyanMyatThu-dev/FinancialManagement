using System;
using System.ComponentModel.DataAnnotations;

namespace ST_finance.Domain.Features.Authentication.Models;

public record RegisterRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Password,
    [Required] string Username,
    [Required] string FullName
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    Guid UserId,
    string Username,
    string Email,
    string FullName,
    DateTime Expiration
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