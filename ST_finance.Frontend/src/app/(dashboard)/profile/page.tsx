"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DollarSign,
  Calendar,
  Target,
  Loader2,
  Save,
  CheckCircle,
  AlertTriangle,
  User as UserIcon,
  Shield,
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [monthlyAllowance, setMonthlyAllowance] = useState(user?.monthlyAllowanceAmount?.toString() || "16000");
  const [allowanceDay,     setAllowanceDay]     = useState(user?.allowanceDayOfMonth?.toString()   || "25");
  const [targetSavings,    setTargetSavings]    = useState(user?.targetMonthlySavings?.toString()  || "2000");
  const [currency,         setCurrency]         = useState(user?.currency || "THB");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateProfile({
      monthlyAllowanceAmount: parseFloat(monthlyAllowance) || 0,
      allowanceDayOfMonth:    parseInt(allowanceDay)       || 25,
      targetMonthlySavings:   parseFloat(targetSavings)   || 0,
      currency,
    });

    setIsSubmitting(false);
    if (result.success) {
      setMessage({ type: "success", text: "Stipend settings updated successfully." });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update profile settings." });
    }
  };

  const avatarInitial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Allowance Profile</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1 font-mono">
          Configure your stipend schedule and financial parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Identity Card ──────────────────────────────────────────── */}
        <div className="ds-card p-6 h-fit space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--primary)/0.15)] border-2 border-[hsl(var(--primary)/0.3)] flex items-center justify-center text-2xl font-black text-[hsl(var(--primary))] mb-4">
              {avatarInitial}
            </div>
            <h2 className="text-base font-bold">{user?.fullName}</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
              @{user?.username}
            </p>
          </div>

          {/* Account details */}
          <div className="border-t border-[hsl(var(--border))] pt-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Email
              </span>
              <span className="text-[11px] font-mono text-[hsl(var(--foreground))] truncate max-w-[140px]">
                {user?.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Status
              </span>
              <span className="ds-badge ds-badge-success">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                Currency
              </span>
              <span className="ds-badge border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]">
                {user?.currency || "THB"}
              </span>
            </div>
          </div>

          {/* Security note */}
          <div className="ds-card p-3 flex items-center gap-2.5 border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.04)]">
            <Shield className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
            <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
              Data secured with JWT token rotation.
            </p>
          </div>
        </div>

        {/* ── Config Form ────────────────────────────────────────────── */}
        <div className="lg:col-span-2 ds-card p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[hsl(var(--border))]">
            <UserIcon className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h3 className="text-sm font-bold tracking-tight">Stipend Scheduler Configuration</h3>
          </div>

          {/* Status message */}
          {message && (
            <div
              className={`flex items-center gap-2.5 p-3.5 mb-5 text-xs font-mono rounded-lg ${
                message.type === "success" ? "ds-alert-success" : "ds-alert-error"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              <p>{message.text}</p>
            </div>
          )}

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Monthly Allowance */}
              <div>
                <label
                  htmlFor="profile-allowance"
                  className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                >
                  Monthly Stipend Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="profile-allowance"
                    type="number"
                    value={monthlyAllowance}
                    onChange={(e) => setMonthlyAllowance(e.target.value)}
                    className="ds-input w-full pl-9 pr-3 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Allowance Day */}
              <div>
                <label
                  htmlFor="profile-day"
                  className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                >
                  Stipend Deposit Day
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="profile-day"
                    type="number"
                    min="1"
                    max="31"
                    value={allowanceDay}
                    onChange={(e) => setAllowanceDay(e.target.value)}
                    className="ds-input w-full pl-9 pr-3 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Target Monthly Savings */}
              <div>
                <label
                  htmlFor="profile-savings"
                  className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                >
                  Target Monthly Savings
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="profile-savings"
                    type="number"
                    value={targetSavings}
                    onChange={(e) => setTargetSavings(e.target.value)}
                    className="ds-input w-full pl-9 pr-3 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label
                  htmlFor="profile-currency"
                  className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono"
                >
                  Currency Code
                </label>
                <input
                  id="profile-currency"
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="THB"
                  className="ds-input w-full px-3 py-2.5 text-sm font-mono"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                id="profile-save-btn"
                type="submit"
                disabled={isSubmitting}
                className="ds-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Commit Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
