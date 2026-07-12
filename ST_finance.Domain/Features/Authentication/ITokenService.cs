using System;
using System.Security.Claims;
using ST_finance.Database.Data;

namespace ST_finance.Domain.Features.Authentication
{
    public interface ITokenService
    {
        string GenerateAccessToken(TblUser user);
        string GenerateRefreshToken();
        ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
    }
}
