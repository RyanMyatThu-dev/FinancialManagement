using System.Threading.Tasks;

namespace ST_finance.Domain.Features.Authentication;

public interface IEmailService
{
    Task SendOtpEmailAsync(string toEmail, string otpCode, string purpose);
}
