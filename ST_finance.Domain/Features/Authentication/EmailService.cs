using System;
using System.Threading.Tasks;
using FluentEmail.Core;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ST_finance.Domain.Features.Authentication;

public class EmailService : IEmailService
{
    private readonly IFluentEmailFactory _fluentEmail;
    public EmailService(IFluentEmailFactory fluentEmail)
    {
        _fluentEmail = fluentEmail;

    }

    public async Task SendOtpEmailAsync(string toEmail, string otpCode, string purpose)
    {
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

        var email = _fluentEmail.Create();

        await email
        .To(toEmail)
        .Subject(subject)
        .Body(htmlBody, true)
        .SendAsync();

    }
}
