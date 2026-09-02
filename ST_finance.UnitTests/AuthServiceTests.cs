using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using ST_finance.Database.Data;
using ST_finance.Domain.Features.Authentication;
using ST_finance.Domain.Features.Authentication.Models;
using Xunit;

namespace ST_finance.UnitTests
{
    /// <summary>
    /// Covers the OTP lifecycle, which previously had no test coverage at all.
    ///
    /// The regression these were written against: a correct code was rejected whenever more than
    /// one live code existed for the same (email, purpose). Validation selected a row by expiry and
    /// only then compared the submitted code against that one row, so a code the user legitimately
    /// held came back as Auth.InvalidOtp if it belonged to any other row.
    /// </summary>
    public class AuthServiceTests
    {
        private const string StoredEmail = "ryan@example.com";
        private const string TwoFactorPurpose = "TwoFactor";
        private const string ToggleTwoFactorPurpose = "TwoFactorToggle";

        private readonly AppDbContext _context;
        private readonly Mock<UserManager<TblUser>> _userManager;
        private readonly Mock<ITokenService> _tokenService;
        private readonly Mock<IEmailService> _emailService;
        private readonly AuthService _service;
        private readonly TblUser _user;

        public AuthServiceTests()
        {
            _context = TestDatabaseFixture.CreateContext();

            _user = new TblUser
            {
                Id = Guid.NewGuid(),
                UserName = "ryan",
                Email = StoredEmail,
                FullName = "Ryan",
                EmailConfirmed = true,
                TwoFactorEnabled = true,
                DeleteFlag = false
            };

            _userManager = CreateUserManagerMock();
            _userManager.Setup(m => m.FindByIdAsync(_user.Id.ToString())).ReturnsAsync(_user);
            _userManager.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((TblUser?)null);
            _userManager.Setup(m => m.GetRolesAsync(It.IsAny<TblUser>()))
                        .ReturnsAsync((IList<string>)new List<string>());
            _userManager.Setup(m => m.UpdateAsync(It.IsAny<TblUser>())).ReturnsAsync(IdentityResult.Success);

            _tokenService = new Mock<ITokenService>();
            _tokenService.Setup(t => t.GenerateAccessToken(It.IsAny<TblUser>(), It.IsAny<IEnumerable<string>>()))
                         .Returns("access-token");
            _tokenService.Setup(t => t.GenerateRefreshToken()).Returns("refresh-token");

            _emailService = new Mock<IEmailService>();
            _emailService.Setup(e => e.SendOtpEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                         .Returns(Task.CompletedTask);

            _service = new AuthService(
                _userManager.Object,
                _context,
                _tokenService.Object,
                _emailService.Object,
                CreateConfiguration());
        }

        // --- the regression -------------------------------------------------------------------

        [Fact]
        public async Task VerifyTwoFactor_AcceptsCode_WhenASecondLiveCodeExistsForTheSameAddress()
        {
            // Two live codes for the same (email, purpose) is what a sign-in retried after a slow
            // cold start leaves behind: GenerateAndSendOtpAsync retires older codes with a
            // read-then-write that is not atomic. "111111" is the one that loses the ordering.
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: 5);
            SeedOtp("222222", TwoFactorPurpose, expiresInMinutes: 9);

            var result = await _service.VerifyTwoFactorAsync(
                new VerifyTwoFactorRequest(_user.Id, "111111"));

            Assert.True(result.IsSuccess);
            Assert.Equal("access-token", result.Value.AccessToken);
            Assert.Equal("refresh-token", result.Value.RefreshToken);
            Assert.False(result.Value.IsTwoFactorRequired);
        }

        [Fact]
        public async Task VerifyTwoFactor_SpendsEveryOtherLiveCode_OnSuccess()
        {
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: 5);
            SeedOtp("222222", TwoFactorPurpose, expiresInMinutes: 9);

            var result = await _service.VerifyTwoFactorAsync(
                new VerifyTwoFactorRequest(_user.Id, "111111"));

            Assert.True(result.IsSuccess);

            var stored = await _context.TblOtpVerifications
                .Where(o => o.Purpose == TwoFactorPurpose)
                .ToListAsync();

            Assert.Equal(2, stored.Count);
            Assert.All(stored, otp => Assert.True(otp.IsUsed));
        }

        [Fact]
        public async Task VerifyTwoFactor_RejectsCode_AfterItHasBeenUsed()
        {
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: 5);

            var first = await _service.VerifyTwoFactorAsync(new VerifyTwoFactorRequest(_user.Id, "111111"));
            var replay = await _service.VerifyTwoFactorAsync(new VerifyTwoFactorRequest(_user.Id, "111111"));

            Assert.True(first.IsSuccess);
            Assert.True(replay.IsFailure);
            Assert.Equal("Auth.InvalidOtp", replay.Error.Code);
        }

        // --- address casing -------------------------------------------------------------------

        [Fact]
        public async Task VerifyTwoFactor_MatchesStoredAddress_RegardlessOfCasing()
        {
            // Postgres compares text case-sensitively, so an address whose casing differs between
            // the send and the verify step must still resolve to the same OTP rows.
            _user.Email = "Ryan@Example.COM";
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: 5, email: "ryan@example.com");

            var result = await _service.VerifyTwoFactorAsync(
                new VerifyTwoFactorRequest(_user.Id, "111111"));

            Assert.True(result.IsSuccess);
        }

        [Fact]
        public async Task SendRegisterOtp_StoresTheAddressLowercased()
        {
            var result = await _service.SendRegisterOtpAsync("Ryan@Example.COM");

            Assert.True(result.IsSuccess);

            var stored = await _context.TblOtpVerifications.SingleAsync();
            Assert.Equal("ryan@example.com", stored.Email);
            Assert.Equal("Register", stored.Purpose);
            Assert.False(stored.IsUsed);
        }

        // --- purpose separation ---------------------------------------------------------------

        [Fact]
        public async Task VerifyTwoFactor_RejectsACodeIssuedForTheTwoFactorToggle()
        {
            SeedOtp("111111", ToggleTwoFactorPurpose, expiresInMinutes: 5);

            var result = await _service.VerifyTwoFactorAsync(
                new VerifyTwoFactorRequest(_user.Id, "111111"));

            Assert.True(result.IsFailure);
            Assert.Equal("Auth.InvalidOtp", result.Error.Code);
        }

        [Fact]
        public async Task ToggleTwoFactor_RejectsACodeIssuedForTheLoginChallenge()
        {
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: 5);

            var result = await _service.ToggleTwoFactorAsync(
                _user.Id, new Toggle2FaRequest(Enable: false, OtpCode: "111111"));

            Assert.True(result.IsFailure);
            Assert.Equal("Auth.InvalidOtp", result.Error.Code);
        }

        // --- the ordinary rejections still reject -----------------------------------------------

        [Fact]
        public async Task VerifyTwoFactor_RejectsAnExpiredCode()
        {
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: -1);

            var result = await _service.VerifyTwoFactorAsync(
                new VerifyTwoFactorRequest(_user.Id, "111111"));

            Assert.True(result.IsFailure);
            Assert.Equal("Auth.InvalidOtp", result.Error.Code);
        }

        [Fact]
        public async Task VerifyTwoFactor_RejectsACodeThatWasNeverIssued()
        {
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: 5);

            var result = await _service.VerifyTwoFactorAsync(
                new VerifyTwoFactorRequest(_user.Id, "999999"));

            Assert.True(result.IsFailure);
            Assert.Equal("Auth.InvalidOtp", result.Error.Code);
        }

        [Fact]
        public async Task VerifyTwoFactor_RejectsWhenTwoFactorIsNotEnabledForTheAccount()
        {
            _user.TwoFactorEnabled = false;
            SeedOtp("111111", TwoFactorPurpose, expiresInMinutes: 5);

            var result = await _service.VerifyTwoFactorAsync(
                new VerifyTwoFactorRequest(_user.Id, "111111"));

            Assert.True(result.IsFailure);
        }

        // --- issuing a new code retires the old one ---------------------------------------------

        [Fact]
        public async Task SendRegisterOtp_RetiresPreviouslyIssuedCodesForTheSamePurpose()
        {
            var supersededId = SeedOtp("111111", "Register", expiresInMinutes: 5);

            var result = await _service.SendRegisterOtpAsync(StoredEmail);

            Assert.True(result.IsSuccess);

            var superseded = await _context.TblOtpVerifications.SingleAsync(o => o.Id == supersededId);
            Assert.True(superseded.IsUsed);

            var live = await _context.TblOtpVerifications.Where(o => !o.IsUsed).ToListAsync();
            Assert.Single(live);
        }

        // --- refresh tokens ---------------------------------------------------------------------

        [Fact]
        public async Task RefreshToken_Fails_WhenTheStoredTokenDoesNotMatch()
        {
            _user.RefreshToken = "the-stored-one";
            _user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1);

            _tokenService.Setup(t => t.GetPrincipalFromExpiredToken(It.IsAny<string>()))
                         .Returns(PrincipalFor(_user.Id));

            var result = await _service.RefreshTokenAsync(
                new RefreshTokenRequest("expired-access-token", "a-different-one"));

            Assert.True(result.IsFailure);
            Assert.Equal("Auth.RefreshTokenExpired", result.Error.Code);
        }

        [Fact]
        public async Task RefreshToken_Fails_WhenTheStoredTokenHasExpired()
        {
            _user.RefreshToken = "the-stored-one";
            _user.RefreshTokenExpiryTime = DateTime.UtcNow.AddMinutes(-1);

            _tokenService.Setup(t => t.GetPrincipalFromExpiredToken(It.IsAny<string>()))
                         .Returns(PrincipalFor(_user.Id));

            var result = await _service.RefreshTokenAsync(
                new RefreshTokenRequest("expired-access-token", "the-stored-one"));

            Assert.True(result.IsFailure);
            Assert.Equal("Auth.RefreshTokenExpired", result.Error.Code);
        }

        // --- helpers ------------------------------------------------------------------------------

        private Guid SeedOtp(string code, string purpose, int expiresInMinutes, string? email = null)
        {
            var id = Guid.NewGuid();
            _context.TblOtpVerifications.Add(new TblOtpVerification
            {
                Id = id,
                Email = email ?? StoredEmail,
                Code = code,
                Purpose = purpose,
                ExpiryTime = DateTime.UtcNow.AddMinutes(expiresInMinutes),
                IsUsed = false
            });
            _context.SaveChanges();
            return id;
        }

        private static ClaimsPrincipal PrincipalFor(Guid userId)
        {
            return new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            }));
        }

        private static Mock<UserManager<TblUser>> CreateUserManagerMock()
        {
            var store = new Mock<IUserStore<TblUser>>();
            return new Mock<UserManager<TblUser>>(
                store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        }

        private static IConfiguration CreateConfiguration()
        {
            var jwtSettings = new Mock<IConfigurationSection>();
            jwtSettings.Setup(s => s["AccessTokenExpiryMinutes"]).Returns("60");
            jwtSettings.Setup(s => s["RefreshTokenExpiryDays"]).Returns("30");

            var configuration = new Mock<IConfiguration>();
            configuration.Setup(c => c.GetSection("JwtSettings")).Returns(jwtSettings.Object);
            return configuration.Object;
        }
    }
}
