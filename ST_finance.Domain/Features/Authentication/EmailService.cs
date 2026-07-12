using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;

namespace ST_finance.Domain.Features.Authentication;

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IResend resend, IConfiguration configuration, ILogger<EmailService> logger)
    {
        _resend = resend;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendOtpEmailAsync(string toEmail, string otpCode, string purpose)
    {
        var apiKey = _configuration["Resend:ApiKey"];
        var subject = purpose switch
        {
            "Register" => "Verify your ST-Finance registration",
            "EmailChange" => "Confirm your new email address",
            "TwoFactor" => "Your ST-Finance verification code",
            _ => "Your ST-Finance verification code"
        };

        var htmlBody = $"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>ST-Finance Verification</h2>
                <p>Your verification code is:</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e;">{otpCode}</p>
                <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            </div>
            """;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning(
                "[EmailService] Resend:ApiKey not configured. OTP for {Email} ({Purpose}): {OtpCode}",
                toEmail, purpose, otpCode);
            Console.WriteLine($"[DEV EMAIL] To: {toEmail} | Purpose: {purpose} | OTP: {otpCode}");
            return;
        }

        var message = new EmailMessage
        {
            From = "ST-Finance <onboarding@resend.dev>",
            To = { toEmail },
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = $"Your ST-Finance verification code is: {otpCode}. This code expires in 10 minutes."
        };

        await _resend.EmailSendAsync(message);
    }
}
