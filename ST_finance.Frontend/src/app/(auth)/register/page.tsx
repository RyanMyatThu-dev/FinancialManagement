"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, User, AlertTriangle, Loader2, Zap } from "lucide-react";

export default function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [username,    setUsername]    = useState("");
  const [email,       setEmail]       = useState("");
  const [fullName,    setFullName]    = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [isSubmitting,setIsSubmitting]= useState(false);

  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await register(username, email, password, fullName);
    setIsSubmitting(false);
    if (result.success) {
      router.push("/");
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
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, hsl(142 86% 55% / 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Header branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center mb-4 neon-pulse">
            <Zap className="h-6 w-6 text-[hsl(var(--primary-foreground))]" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">ST-Finance</h1>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1 font-mono uppercase tracking-widest">
            Create Your Profile
          </p>
        </div>

        {/* Card */}
        <div className="ds-card p-8">
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

          <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
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
                  placeholder="Ryan Myat Thu"
                  className="ds-input w-full pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Username */}
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
                  placeholder="ryanmt"
                  className="ds-input w-full pl-8 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Email */}
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
                  placeholder="student@university.edu"
                  className="ds-input w-full pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Password */}
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ds-input w-full pl-9 pr-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="ds-btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Create Account
                </>
              )}
            </button>
          </form>

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
