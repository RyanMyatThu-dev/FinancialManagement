"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, AlertTriangle, Loader2, Zap, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { apiClient } from "@/api/client";

export default function LoginPage() {
  const { login, verifyTwoFactor, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password flow states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1 = request, 2 = verify & reset
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [forgotPasswordOtpDigits, setForgotPasswordOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    document.title = "Login | ST-Finance";
  }, []);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.isTwoFactorRequired && result.userId) {
      setTwoFactorUserId(result.userId);
      setOtpDigits(Array(6).fill(""));
      setOtpCode("");
      return;
    }

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Invalid email or password.");
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newOtpDigits);
    setOtpCode(newOtpDigits.join(""));

    if (value && index < 5) {
      const nextInput = document.getElementById(`login-2fa-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index - 1] = "";
        setOtpDigits(newOtpDigits);
        setOtpCode(newOtpDigits.join(""));
        const prevInput = document.getElementById(`login-2fa-otp-${index - 1}`);
        prevInput?.focus();
      } else {
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = "";
        setOtpDigits(newOtpDigits);
        setOtpCode(newOtpDigits.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setOtpDigits(digits);
    setOtpCode(pastedData);

    const lastInput = document.getElementById(`login-2fa-otp-5`);
    lastInput?.focus();
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorUserId) return;

    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const result = await verifyTwoFactor(twoFactorUserId, otpCode);
    setIsSubmitting(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Invalid verification code.");
    }
  };

  const handleBackToLogin = () => {
    setTwoFactorUserId(null);
    setOtpCode("");
    setOtpDigits(Array(6).fill(""));
    setError(null);
  };

  const handleForgotPasswordOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtpDigits = [...forgotPasswordOtpDigits];
    newOtpDigits[index] = value.substring(value.length - 1);
    setForgotPasswordOtpDigits(newOtpDigits);
    setForgotPasswordOtp(newOtpDigits.join(""));

    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-password-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleForgotPasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!forgotPasswordOtpDigits[index] && index > 0) {
        const newOtpDigits = [...forgotPasswordOtpDigits];
        newOtpDigits[index - 1] = "";
        setForgotPasswordOtpDigits(newOtpDigits);
        setForgotPasswordOtp(newOtpDigits.join(""));
        const prevInput = document.getElementById(`forgot-password-otp-${index - 1}`);
        prevInput?.focus();
      } else {
        const newOtpDigits = [...forgotPasswordOtpDigits];
        newOtpDigits[index] = "";
        setForgotPasswordOtpDigits(newOtpDigits);
        setForgotPasswordOtp(newOtpDigits.join(""));
      }
    }
  };

  const handleForgotPasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setForgotPasswordOtpDigits(digits);
    setForgotPasswordOtp(pastedData);

    const lastInput = document.getElementById(`forgot-password-otp-5`);
    lastInput?.focus();
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/api/auth/forgot-password/send-otp", {
        email: forgotPasswordEmail,
      });
      const result = response.data;
      if (result.isSuccess) {
        setForgotPasswordStep(2);
        setForgotPasswordOtpDigits(Array(6).fill(""));
        setForgotPasswordOtp("");
      } else {
        setError(result.error?.message || "Failed to send reset code. Please verify your email.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail || forgotPasswordOtp.length !== 6 || !newPassword) return;

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/api/auth/forgot-password/reset", {
        email: forgotPasswordEmail,
        otpCode: forgotPasswordOtp,
        newPassword: newPassword,
      });
      const result = response.data;
      if (result.isSuccess) {
        setForgotPasswordMode(false);
        setForgotPasswordEmail("");
        setForgotPasswordOtp("");
        setForgotPasswordOtpDigits(Array(6).fill(""));
        setNewPassword("");
        setConfirmNewPassword("");
        setEmail(forgotPasswordEmail);
        setPassword("");
        setError("Password reset successfully! You can now log in with your new password.");
      } else {
        setError(result.error?.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[hsl(var(--background))] px-6 py-12 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, hsl(142 86% 55% / 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 text-center">
          <Logo className="h-14 w-14 mb-4 neon-pulse" />
          <h1 className="text-xl font-extrabold tracking-tight">ST-Finance</h1>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 font-mono uppercase tracking-widest">
            Student Financial System
          </p>
        </div>

        <div className="ds-card p-8">
          {twoFactorUserId ? (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                  <ShieldCheck className="h-3 w-3 text-[hsl(var(--primary))]" />
                  2FA Required
                </div>
                <h2 className="text-xl font-bold tracking-tight">Verify Identity</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {error && (
                <div className="ds-alert-error flex items-start gap-2.5 p-3.5 mb-5 text-xs font-mono">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase text-[10px] mb-0.5">Verification Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form id="login-2fa-form" onSubmit={handleVerify2Fa} className="space-y-6" autoComplete="off">
                <div>
                  <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest text-center mb-3 font-mono">
                    Verification Code
                  </label>
                  
                  {/* 6 Square Box 2FA OTP Inputs */}
                  <div className="flex justify-center gap-2.5">
                    {Array(6).fill(0).map((_, idx) => (
                      <input
                        key={idx}
                        id={`login-2fa-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otpDigits[idx] || ""}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onPaste={idx === 0 ? handlePaste : undefined}
                        className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] transition-all outline-none font-mono"
                        autoFocus={idx === 0}
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>

                <button
                  id="login-2fa-submit-btn"
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify & Sign In
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors font-mono border-t border-[hsl(var(--border))] pt-3"
                >
                  ← Back to login
                </button>
              </form>
            </>
          ) : forgotPasswordMode ? (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                  Password Recovery
                </div>
                <h2 className="text-xl font-bold tracking-tight">
                  {forgotPasswordStep === 1 ? "Reset Password" : "Create New Password"}
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono">
                  {forgotPasswordStep === 1
                    ? "Enter your email to receive a recovery code"
                    : "Enter the OTP code and your new password details"}
                </p>
              </div>

              {error && (
                <div className="ds-alert-error flex items-start gap-2.5 p-3.5 mb-5 text-xs font-mono">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase text-[10px] mb-0.5">Recovery Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {forgotPasswordStep === 1 ? (
                <form id="forgot-password-request-form" onSubmit={handleRequestResetOtp} className="space-y-4" autoComplete="off">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="ds-input w-full pl-9 pr-3 py-2.5 text-sm"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <button
                    id="forgot-request-submit-btn"
                    type="submit"
                    disabled={isSubmitting || !forgotPasswordEmail}
                    className="ds-btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs font-bold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <Mail className="h-3.5 w-3.5" />
                        Send Verification Code
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordMode(false);
                      setError(null);
                    }}
                    className="w-full text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors font-mono border-t border-[hsl(var(--border))] pt-3"
                  >
                    ← Back to login
                  </button>
                </form>
              ) : (
                <form id="forgot-password-reset-form" onSubmit={handleResetPassword} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest text-center mb-3 font-mono">
                      Verification Code
                    </label>
                    
                    {/* 6 Square Box OTP Inputs */}
                    <div className="flex justify-center gap-2.5 mb-4">
                      {Array(6).fill(0).map((_, idx) => (
                        <input
                          key={idx}
                          id={`forgot-password-otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={forgotPasswordOtpDigits[idx] || ""}
                          onChange={(e) => handleForgotPasswordOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleForgotPasswordKeyDown(e, idx)}
                          onPaste={idx === 0 ? handleForgotPasswordPaste : undefined}
                          className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] transition-all outline-none font-mono"
                          autoFocus={idx === 0}
                          autoComplete="off"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-new-password"
                      className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <input
                        id="forgot-new-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="ds-input w-full pl-9 pr-10 py-2.5 text-sm"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-confirm-password"
                      className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <input
                        id="forgot-confirm-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="ds-input w-full pl-9 pr-10 py-2.5 text-sm"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <button
                    id="forgot-reset-submit-btn"
                    type="submit"
                    disabled={isSubmitting || forgotPasswordOtp.length !== 6 || !newPassword || !confirmNewPassword}
                    className="ds-btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs font-bold"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Reset Password
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordStep(1);
                      setForgotPasswordOtp("");
                      setForgotPasswordOtpDigits(Array(6).fill(""));
                      setError(null);
                    }}
                    className="w-full text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors font-mono border-t border-[hsl(var(--border))] pt-3"
                  >
                    ← Back to email request
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
                  Secure Auth
                </div>
                <h2 className="text-xl font-bold tracking-tight">Sign In</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono">
                  Enter your credentials to access the ledger
                </p>
              </div>

              {error && (
                <div className="ds-alert-error flex items-start gap-2.5 p-3.5 mb-5 text-xs font-mono">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase text-[10px] mb-0.5">Auth Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form id="login-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ds-input w-full pl-9 pr-3 py-2.5 text-sm"
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ds-input w-full pl-9 pr-10 py-2.5 text-sm"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus:outline-none transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotPasswordMode(true);
                        setForgotPasswordStep(1);
                        setForgotPasswordEmail("");
                        setForgotPasswordOtp("");
                        setForgotPasswordOtpDigits(Array(6).fill(""));
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setError(null);
                      }}
                      className="text-[10px] font-bold text-[hsl(var(--primary))] hover:text-white transition-all font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="ds-btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      Access Ledger
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
                No account?{" "}
                <Link
                  href="/register"
                  className="font-bold text-[hsl(var(--primary))] hover:underline transition-all"
                >
                  Create one here
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
