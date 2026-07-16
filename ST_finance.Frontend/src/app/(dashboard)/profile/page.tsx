"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiClient } from "@/api/client";
import {
  User as UserIcon,
  Mail,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  KeyRound,
} from "lucide-react";

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user, refreshProfile, updateProfile } = useAuth();

  // Username State
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Budget Settings State
  const [currency, setCurrency] = useState(user?.currency || "THB");
  const [enableQuotaPacing, setEnableQuotaPacing] = useState(user?.enableQuotaPacing ?? true);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setCurrency(user.currency || "THB");
      setEnableQuotaPacing(user.enableQuotaPacing ?? true);
    }
  }, [user]);

  // Handle Budget Settings Update
  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetLoading(true);
    setBudgetMessage(null);

    const res = await updateProfile({
      currency,
      enableQuotaPacing,
    });

    if (res.success) {
      showToast("Budget settings updated successfully", "success");
      setBudgetMessage({ type: "success", text: "Budget settings updated successfully." });
      await refreshProfile();
    } else {
      showToast(res.error || "Failed to update budget settings", "error");
      setBudgetMessage({ type: "error", text: res.error || "Failed to update budget settings." });
    }
    setBudgetLoading(false);
  };
  const [usernameMessage, setUsernameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email State
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [emailStep, setEmailStep] = useState<"input" | "verify">("input");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA State
  const [show2FaConfirm, setShow2FaConfirm] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [twoFactorOtpDigits, setTwoFactorOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Update initial newUsername state when user context is loaded
  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user]);

  // Handle Username Update
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      setUsernameMessage({ type: "error", text: "Username cannot be empty." });
      return;
    }
    setUsernameLoading(true);
    setUsernameMessage(null);

    try {
      const response = await apiClient.post("/api/auth/profile/update-username", { newUsername });
      const result = response.data;
      if (result.isSuccess) {
        showToast("Username updated successfully", "success");
        setUsernameMessage({ type: "success", text: "Username updated successfully." });
        await refreshProfile();
      } else {
        const errorMsg = result.error?.message || "Failed to update username.";
        showToast(errorMsg, "error");
        setUsernameMessage({ type: "error", text: errorMsg });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to update username.";
      showToast(msg, "error");
      setUsernameMessage({ type: "error", text: msg });
    } finally {
      setUsernameLoading(false);
    }
  };

  // Handle Email Change Request
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setEmailMessage({ type: "error", text: "Please enter a valid new email address." });
      return;
    }
    setEmailLoading(true);
    setEmailMessage(null);

    try {
      const response = await apiClient.post("/api/auth/profile/request-email-change", { newEmail });
      const result = response.data;
      if (result.isSuccess) {
        setEmailStep("verify");
        setEmailOtpDigits(Array(6).fill(""));
        setEmailOtp("");
        setEmailMessage({ type: "success", text: "Verification code sent to your new email." });
      } else {
        setEmailMessage({ type: "error", text: result.error?.message || "Failed to send verification code." });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to request email change.";
      setEmailMessage({ type: "error", text: msg });
    } finally {
      setEmailLoading(false);
    }
  };

  // Email OTP input handlers
  const handleEmailOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;
    const newDigits = [...emailOtpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setEmailOtpDigits(newDigits);
    setEmailOtp(newDigits.join(""));
    if (value && index < 5) {
      document.getElementById(`email-otp-${index + 1}`)?.focus();
    }
  };

  const handleEmailOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!emailOtpDigits[index] && index > 0) {
        const newDigits = [...emailOtpDigits];
        newDigits[index - 1] = "";
        setEmailOtpDigits(newDigits);
        setEmailOtp(newDigits.join(""));
        document.getElementById(`email-otp-${index - 1}`)?.focus();
      } else {
        const newDigits = [...emailOtpDigits];
        newDigits[index] = "";
        setEmailOtpDigits(newDigits);
        setEmailOtp(newDigits.join(""));
      }
    }
  };

  const handleEmailOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;
    const digits = pastedData.split("");
    setEmailOtpDigits(digits);
    setEmailOtp(pastedData);
    document.getElementById(`email-otp-5`)?.focus();
  };

  // Handle Email Change Confirm
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtp.length !== 6) {
      setEmailMessage({ type: "error", text: "Verification code is required." });
      return;
    }
    setEmailLoading(true);
    setEmailMessage(null);

    try {
      const response = await apiClient.post("/api/auth/profile/confirm-email-change", {
        newEmail,
        otpCode: emailOtp,
      });
      const result = response.data;
      if (result.isSuccess) {
        setEmailMessage({ type: "success", text: "Email address updated successfully." });
        setNewEmail("");
        setEmailOtp("");
        setEmailOtpDigits(Array(6).fill(""));
        setEmailStep("input");
        await refreshProfile();
      } else {
        setEmailMessage({ type: "error", text: result.error?.message || "Verification failed." });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to verify email change.";
      setEmailMessage({ type: "error", text: msg });
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const response = await apiClient.post("/api/auth/profile/change-password", {
        currentPassword,
        newPassword,
      });
      const result = response.data;
      if (result.isSuccess) {
        setPasswordMessage({ type: "success", text: "Password reset successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: result.error?.message || "Password change failed." });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to change password.";
      setPasswordMessage({ type: "error", text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle 2FA Toggle Init
  const handleToggle2Fa = async () => {
    setTwoFactorMessage(null);
    setTwoFactorLoading(true);

    try {
      const targetState = !user?.twoFactorEnabled;
      const response = await apiClient.post("/api/auth/profile/toggle-2fa", {
        enable: targetState,
      });
      const result = response.data;
      if (result.isSuccess) {
        setShow2FaConfirm(true);
        setTwoFactorOtpDigits(Array(6).fill(""));
        setTwoFactorOtp("");
        setTwoFactorMessage({
          type: "success",
          text: `Verification code sent to confirm ${targetState ? "enabling" : "disabling"} 2FA.`,
        });
      } else {
        setTwoFactorMessage({ type: "error", text: result.error?.message || "Failed to process 2FA request." });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to initiate 2FA toggle.";
      setTwoFactorMessage({ type: "error", text: msg });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // 2FA OTP input handlers
  const handle2FaOtpChange = (value: string, index: number) => {
    if (value && !/^\d+$/.test(value)) return;
    const newDigits = [...twoFactorOtpDigits];
    newDigits[index] = value.substring(value.length - 1);
    setTwoFactorOtpDigits(newDigits);
    setTwoFactorOtp(newDigits.join(""));
    if (value && index < 5) {
      document.getElementById(`twofactor-otp-${index + 1}`)?.focus();
    }
  };

  const handle2FaOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!twoFactorOtpDigits[index] && index > 0) {
        const newDigits = [...twoFactorOtpDigits];
        newDigits[index - 1] = "";
        setTwoFactorOtpDigits(newDigits);
        setTwoFactorOtp(newDigits.join(""));
        document.getElementById(`twofactor-otp-${index - 1}`)?.focus();
      } else {
        const newDigits = [...twoFactorOtpDigits];
        newDigits[index] = "";
        setTwoFactorOtpDigits(newDigits);
        setTwoFactorOtp(newDigits.join(""));
      }
    }
  };

  const handle2FaOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;
    const digits = pastedData.split("");
    setTwoFactorOtpDigits(digits);
    setTwoFactorOtp(pastedData);
    document.getElementById(`twofactor-otp-5`)?.focus();
  };

  // Handle 2FA Verification and Activation/Deactivation
  const handleConfirm2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorOtp.length !== 6) {
      setTwoFactorMessage({ type: "error", text: "Verification code is required." });
      return;
    }
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);

    try {
      const targetState = !user?.twoFactorEnabled;
      const response = await apiClient.post("/api/auth/profile/toggle-2fa", {
        enable: targetState,
        otpCode: twoFactorOtp,
      });
      const result = response.data;
      if (result.isSuccess) {
        setTwoFactorMessage({
          type: "success",
          text: `Two-factor authentication has been ${targetState ? "enabled" : "disabled"}.`,
        });
        setTwoFactorOtp("");
        setTwoFactorOtpDigits(Array(6).fill(""));
        setShow2FaConfirm(false);
        await refreshProfile();
      } else {
        setTwoFactorMessage({ type: "error", text: result.error?.message || "Verification failed." });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to toggle 2FA.";
      setTwoFactorMessage({ type: "error", text: msg });
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const avatarInitial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Account Settings</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 font-mono">
          Manage your personal details, email credentials, security methods, and authentication settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Identity Overview Card ────────────────────────────────── */}
        <div className="ds-card p-6 h-fit space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-2xl bg-[hsl(var(--primary)/0.15)] border-2 border-[hsl(var(--primary)/0.3)] flex items-center justify-center text-3xl font-black text-[hsl(var(--primary))] mb-4">
              {avatarInitial}
            </div>
            <h2 className="text-lg font-bold">{user?.fullName}</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
              @{user?.username}
            </p>
          </div>

          <div className="border-t border-[hsl(var(--border))] pt-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] block">
                Primary Email
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[hsl(var(--foreground))] truncate max-w-[190px]">
                  {user?.email}
                </span>
                {user?.emailConfirmed ? (
                  <span className="ds-badge ds-badge-success text-[8px]">Confirmed</span>
                ) : (
                  <span className="ds-badge ds-badge-danger text-[8px]">Unconfirmed</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Two-Factor (2FA)
              </span>
              {user?.twoFactorEnabled ? (
                <span className="ds-badge ds-badge-success text-[8px] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Active
                </span>
              ) : (
                <span className="ds-badge border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] text-[8px] flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> Inactive
                </span>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Account Status
              </span>
              <span className="ds-badge ds-badge-success text-[8px]">Verified Ledger Student</span>
            </div>
          </div>

          <div className="ds-card p-3.5 flex items-start gap-2.5 border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.04)]">
            <Shield className="h-4 w-4 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
            <div className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] leading-normal">
              Authentication settings are managed securely. All email updates require direct token validation.
            </div>
          </div>
        </div>

        {/* ── Settings Controls Panel ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Username Update */}
          <div className="ds-card p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
              <UserIcon className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h3 className="text-sm font-bold tracking-tight">Username Settings</h3>
            </div>

            {usernameMessage && (
              <div
                className={`flex items-center gap-2.5 p-3.5 mb-4 text-xs font-mono rounded-lg ${
                  usernameMessage.type === "success" ? "ds-alert-success" : "ds-alert-error"
                }`}
              >
                {usernameMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <p>{usernameMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label
                  htmlFor="settings-username"
                  className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                >
                  System Username
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] text-sm font-mono">
                      @
                    </span>
                    <input
                      id="settings-username"
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="username"
                      className="ds-input w-full pl-8 pr-3 py-2.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={usernameLoading || newUsername === user?.username}
                    className="ds-btn-primary px-4 py-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                  >
                    {usernameLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section: Budget & Pacing Settings */}
          <div className="ds-card p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
              <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h3 className="text-sm font-bold tracking-tight">Budget & Pacing Settings</h3>
            </div>

            {budgetMessage && (
              <div
                className={`flex items-center gap-2.5 p-3.5 mb-4 text-xs font-mono rounded-lg ${
                  budgetMessage.type === "success" ? "ds-alert-success" : "ds-alert-error"
                }`}
              >
                {budgetMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <p>{budgetMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleUpdateBudget} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Daily Quota Pacing Toggle */}
                <div>
                  <label
                    htmlFor="enable-quota-pacing"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Daily Quota Pacing
                  </label>
                  <select
                    id="enable-quota-pacing"
                    value={enableQuotaPacing ? "true" : "false"}
                    onChange={(e) => setEnableQuotaPacing(e.target.value === "true")}
                    className="ds-input w-full px-3 py-2.5 text-sm"
                  >
                    <option value="true">Enabled (Pace spending daily)</option>
                    <option value="false">Disabled (Hide spending quota)</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label
                    htmlFor="profile-currency"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Currency Display
                  </label>
                  <select
                    id="profile-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="ds-input w-full px-3 py-2.5 text-sm"
                  >
                    <option value="THB">THB (฿)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="MMK">MMK (K)</option>
                  </select>
                </div>
              </div>

              {/* How Pacing Works Explanation Block */}
              <div className="bg-[hsl(var(--secondary)/0.3)] p-4 rounded-lg border border-[hsl(var(--border))] text-xs font-mono space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--primary))] block">
                  ⚙️ How Budget Pacing Works
                </span>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  Our pacing engine automatically aligns your daily quota reset date with your <strong>largest active recurring Income schedule</strong> (e.g., your salary, allowance, or primary pocket money).
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                  If you have not configured any recurring Income schedules yet, the engine falls back to a <strong>rolling 30-day window</strong> to pace your disposable balance.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={budgetLoading}
                  className="ds-btn-primary px-5 py-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                >
                  {budgetLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Save Budget Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Email Update (OTP) */}
          <div className="ds-card p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
              <Mail className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h3 className="text-sm font-bold tracking-tight">Email Validation Settings</h3>
            </div>

            {emailMessage && (
              <div
                className={`flex items-center gap-2.5 p-3.5 mb-4 text-xs font-mono rounded-lg ${
                  emailMessage.type === "success" ? "ds-alert-success" : "ds-alert-error"
                }`}
              >
                {emailMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <p>{emailMessage.text}</p>
              </div>
            )}

            {emailStep === "input" ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                <div>
                  <label
                    htmlFor="settings-email"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    New Email Address
                  </label>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))] font-mono mb-2">
                    A confirmation code will be sent to the new email address.
                  </p>
                  <div className="flex gap-2">
                    <input
                      id="settings-email"
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new-email@university.edu"
                      className="ds-input flex-1 px-3 py-2.5 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={emailLoading || !newEmail || newEmail === user?.email}
                      className="ds-btn-primary px-4 py-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                    >
                      {emailLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Send Code"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest text-center mb-3 font-mono">
                      Enter 6-Digit OTP Sent to {newEmail}
                    </label>

                    {/* 6 Square Box Email OTP Inputs */}
                    <div className="flex justify-center gap-2.5">
                      {Array(6).fill(0).map((_, idx) => (
                        <input
                          key={idx}
                          id={`email-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={emailOtpDigits[idx] || ""}
                          onChange={(e) => handleEmailOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleEmailOtpKeyDown(e, idx)}
                          onPaste={idx === 0 ? handleEmailOtpPaste : undefined}
                          className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] transition-all outline-none font-mono"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      disabled={emailLoading || emailOtp.length !== 6}
                      className="ds-btn-primary flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                    >
                      {emailLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Verify & Update"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailStep("input");
                        setEmailOtp("");
                        setEmailOtpDigits(Array(6).fill(""));
                        setEmailMessage(null);
                      }}
                      className="ds-btn-outline px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Section 3: Password Update */}
          <div className="ds-card p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
              <Lock className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h3 className="text-sm font-bold tracking-tight">Security Credentials</h3>
            </div>

            {passwordMessage && (
              <div
                className={`flex items-center gap-2.5 p-3.5 mb-4 text-xs font-mono rounded-lg ${
                  passwordMessage.type === "success" ? "ds-alert-success" : "ds-alert-error"
                }`}
              >
                {passwordMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <p>{passwordMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ds-input w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ds-input w-full px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ds-input w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="ds-btn-primary px-5 py-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                >
                  {passwordLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 4: 2FA Security */}
          <div className="ds-card p-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[hsl(var(--border))]">
              <Shield className="h-4 w-4 text-[hsl(var(--primary))]" />
              <h3 className="text-sm font-bold tracking-tight">Two-Factor Authentication (2FA)</h3>
            </div>

            {twoFactorMessage && (
              <div
                className={`flex items-center gap-2.5 p-3.5 mb-4 text-xs font-mono rounded-lg ${
                  twoFactorMessage.type === "success" ? "ds-alert-success" : "ds-alert-error"
                }`}
              >
                {twoFactorMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <p>{twoFactorMessage.text}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[hsl(var(--secondary)/0.3)] p-4 rounded-lg border border-[hsl(var(--border))]">
                <div>
                  <h4 className="text-xs font-bold">Email Verification Security</h4>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                    Require a 6-digit verification code sent to your email whenever you sign in.
                  </p>
                </div>

                {!show2FaConfirm && (
                  <button
                    type="button"
                    onClick={handleToggle2Fa}
                    disabled={twoFactorLoading}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                      user?.twoFactorEnabled
                        ? "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.3)] hover:bg-[hsl(var(--destructive)/0.25)]"
                        : "ds-btn-primary"
                    }`}
                  >
                    {twoFactorLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : user?.twoFactorEnabled ? (
                      "Disable 2FA"
                    ) : (
                      "Enable 2FA"
                    )}
                  </button>
                )}
              </div>

              {show2FaConfirm && (
                <form onSubmit={handleConfirm2Fa} className="ds-card p-4 space-y-4 border-[hsl(var(--primary)/0.3)]">
                  <div>
                    <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest text-center mb-3 font-mono">
                      Enter 6-Digit Code Sent to {user?.email}
                    </label>

                    {/* 6 Square Box 2FA Activation OTP Inputs */}
                    <div className="flex justify-center gap-2.5">
                      {Array(6).fill(0).map((_, idx) => (
                        <input
                          key={idx}
                          id={`twofactor-otp-${idx}`}
                          type="text"
                          maxLength={1}
                          value={twoFactorOtpDigits[idx] || ""}
                          onChange={(e) => handle2FaOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handle2FaOtpKeyDown(e, idx)}
                          onPaste={idx === 0 ? handle2FaOtpPaste : undefined}
                          className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] transition-all outline-none font-mono"
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={twoFactorLoading || twoFactorOtp.length !== 6}
                      className="ds-btn-primary flex-1 py-2 text-xs font-bold uppercase tracking-wider"
                    >
                      {twoFactorLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Confirm Security Change"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShow2FaConfirm(false);
                        setTwoFactorOtp("");
                        setTwoFactorOtpDigits(Array(6).fill(""));
                        setTwoFactorMessage(null);
                      }}
                      className="ds-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
