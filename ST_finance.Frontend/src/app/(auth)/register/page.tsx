"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, User, AlertTriangle, Loader2, Zap, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function RegisterPage() {
  const { register, sendRegisterOtp, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    document.title = "Register | ST-Finance";
  }, []);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !username || !fullName || !password || !confirmPassword) {
      setError("Please fill in all registration fields first.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSendingOtp(true);
    const result = await sendRegisterOtp(email);
    setIsSendingOtp(false);

    if (result.success) {
      setOtpSent(true);
      setOtpDigits(Array(6).fill(""));
      setOtpCode("");
      setInfo("Verification code sent. Check your email (or API console in dev mode).");
    } else {
      setError(result.error || "Failed to send verification code.");
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newOtpDigits);
    setOtpCode(newOtpDigits.join(""));

    if (value && index < 5) {
      const nextInput = document.getElementById(`register-otp-${index + 1}`);
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
        const prevInput = document.getElementById(`register-otp-${index - 1}`);
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

    const lastInput = document.getElementById(`register-otp-5`);
    lastInput?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await register(username, email, password, fullName, otpCode);
    setIsSubmitting(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Registration failed.");
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
            {otpSent ? "Email Verification" : "Create Your Profile"}
          </p>
        </div>

        <div className="ds-card p-8">
          {otpSent ? (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                  <ShieldCheck className="h-3 w-3 text-[hsl(var(--primary))]" />
                  Verify Email
                </div>
                <h2 className="text-xl font-bold tracking-tight">Verify Your Email Address</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 font-mono">
                  We sent a 6-digit verification code to
                </p>
                <p className="text-xs text-[hsl(var(--foreground))] font-bold font-mono mt-0.5">
                  {email}
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

              {info && (
                <div className="ds-alert-success flex items-start gap-2.5 p-3.5 mb-5 text-xs font-mono">
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{info}</p>
                </div>
              )}

              <form id="register-otp-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest text-center mb-3 font-mono">
                    Verification Code
                  </label>
                  
                  {/* 6 Square Box OTP Inputs */}
                  <div className="flex justify-center gap-2.5">
                    {Array(6).fill(0).map((_, idx) => (
                      <input
                        key={idx}
                        id={`register-otp-${idx}`}
                        type="text"
                        maxLength={1}
                        value={otpDigits[idx] || ""}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        onPaste={idx === 0 ? handlePaste : undefined}
                        className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] transition-all outline-none font-mono"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={isSubmitting || otpCode.length !== 6}
                  className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      Verify & Register
                    </>
                  )}
                </button>

                <div className="flex flex-col gap-2 pt-2 text-center border-t border-[hsl(var(--border))]">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="text-xs text-[hsl(var(--primary))] hover:underline font-mono"
                  >
                    {isSendingOtp ? "Sending code..." : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                      setOtpDigits(Array(6).fill(""));
                      setError(null);
                      setInfo(null);
                    }}
                    className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors font-mono flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to details
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--chula-pink))]" />
                  New Account
                </div>
                <h2 className="text-xl font-bold tracking-tight">Initialize Profile</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono">
                  Register your student financial account
                </p>
              </div>

              {error && (
                <div className="ds-alert-error flex items-start gap-2.5 p-3.5 mb-5 text-xs font-mono">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase text-[10px] mb-0.5">Registration Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <form id="register-details-form" onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="register-fullname"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      id="register-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="ds-input w-full pl-9 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-username"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] text-sm font-mono">
                      @
                    </span>
                    <input
                      id="register-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="ds-input w-full pl-8 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-email"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      id="register-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ds-input w-full pl-9 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="register-password"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="ds-input w-full pl-9 pr-10 py-2.5 text-sm"
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
                </div>

                <div>
                  <label
                    htmlFor="register-confirm-password"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="ds-input w-full pl-9 pr-10 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] focus:outline-none transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  id="register-details-submit-btn"
                  type="submit"
                  disabled={isSendingOtp}
                  className="ds-btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs font-bold"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      Send Verification Code
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[hsl(var(--primary))] hover:underline transition-all"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
