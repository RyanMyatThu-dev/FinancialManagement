"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Shield,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lock,
  Wallet,
  Clock,
  Sparkles,
  ChevronRight,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 overflow-x-hidden selection:bg-[hsl(var(--primary)/0.3)] selection:text-[hsl(var(--primary))] font-sans">
      
      {/* ─── Parallax Background Logo ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute right-5 md:-right-[3.75rem] top-12 md:-top-6 w-[500px] h-[500px] md:w-[850px] md:h-[850px] opacity-[0.16] dark:opacity-[0.12] transition-transform duration-75 ease-out"
          style={{
            transform: `translateY(${scrollY * 0.12}px) rotate(${-22 + scrollY * 0.015}deg) scale(1.1)`,
          }}
        >
          <img src="/logo-large.png" alt="Large ST-Finance Shield" className="w-full h-full object-contain" />
        </div>
        
        {/* Soft grid overlay for futuristic feel */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"
          style={{
            transform: `translateY(${scrollY * -0.02}px)`,
          }}
        />
      </div>

      {/* ─── Navigation Header ─── */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8" />
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            ST-Finance
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-zinc-950 text-xs font-bold transition-all hover:opacity-90 flex items-center gap-1.5 shadow-md shadow-[hsl(var(--primary)/0.15)] animate-shimmer"
            >
              Go to Dashboard
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-zinc-950 text-xs font-bold transition-all hover:opacity-90 shadow-md shadow-[hsl(var(--primary)/0.15)]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="relative pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto z-10 space-y-32">
        <section className="flex flex-col items-start text-left max-w-3xl space-y-6 pt-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--primary))]">
            <Sparkles className="h-3.5 w-3.5" />
            Zero-Waste Financial Shield
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-zinc-50 animate-fade-in-up">
            Protect your budget.<br />
            <span className="bg-gradient-to-r from-[hsl(var(--primary))] to-emerald-400 bg-clip-text text-transparent">
              Shield your allowance.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
            As students, monthly allowances disappear instantly because of unintentional overspending. 
            ST-Finance shields your money using automatic rolling daily quotas, automated bills reservation, and active safety safeguards.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg bg-[hsl(var(--primary))] text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)/0.2)] flex items-center gap-2"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-lg bg-[hsl(var(--primary))] text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)/0.2)] flex items-center gap-2"
                >
                  Start Saving Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="px-6 py-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/80 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-zinc-50 transition-colors"
                >
                  Learn More
                </a>
              </>
            )}
          </div>
        </section>

        {/* ─── The Student Problem Section ─── */}
        <ScrollReveal>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center border-t border-zinc-900 pt-16">
            <div className="space-y-6">
              <div className="h-10 w-10 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">
                Why student allowances vanish instantly
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Most budgeting apps are passive. They track where your money went *after* you have already overspent. 
                Without active guardrails, a sudden dinner or forgotten subscription leaves students broke by week two.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <p className="text-xs text-zinc-300 font-medium">Passive tracking does not prevent overspending at checkout.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0" />
                  <p className="text-xs text-zinc-300 font-medium">Recurring expenses block your visibility into actual daily buying power.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 lg:pl-6">
              <div className="h-10 w-10 rounded-xl bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.3)] flex items-center justify-center text-[hsl(var(--primary))]">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">
                Active shield protection
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                ST-Finance changes the paradigm. We lock your bill allocations away immediately, then divide your remaining allowance into a rolling daily quota. If you stay under today, it rolls over to tomorrow. If you go over, tomorrow adjusts to keep you safe.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] mt-2 shrink-0" />
                  <p className="text-xs text-zinc-300 font-medium">Daily Safe-To-Spend quota calculates dynamic, real-time allowance limit.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] mt-2 shrink-0" />
                  <p className="text-xs text-zinc-300 font-medium">Automated bill-reserves lock down subscriptions beforehand.</p>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ─── Key Features Walkthrough ─── */}
        <section id="how-it-works" className="space-y-24 border-t border-zinc-900 pt-16">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-zinc-50">How ST-Finance protects your budget</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Three critical core pillars designed to align student routines with proactive financial limits.
            </p>
          </div>

          <div className="space-y-32">
            
            {/* Feature 1: Rolling Daily Quotas */}
            <ScrollReveal>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)] text-[10px] font-bold text-[hsl(var(--primary))] uppercase">
                    Core Shield
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-50">
                    Rolling Daily Quotas
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Instead of a generic monthly limit, ST-Finance divides your disposable balance by the days left in the cycle. 
                    Staying under today rolls your remaining allowance over to boost tomorrow's buying power automatically. Overspending adapts tomorrow's budget down to keep you on track.
                  </p>
                  <ul className="space-y-3 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      Automatic roll-over logic calculations
                    </li>
                    <li className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      Dynamic daily safe-to-spend visualization
                    </li>
                  </ul>
                </div>
                
                <div className="lg:col-span-7">
                  {/* Clean Gray Bounded Placeholder Card */}
                  <div className="relative aspect-video w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-center p-8 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 to-zinc-950/50" />
                    <div className="z-10 flex flex-col items-center gap-3 text-center">
                      <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                        [ Daily Quota Dashboard Screenshot Placeholder ]
                      </p>
                      <p className="text-[10px] text-zinc-600 max-w-xs">
                        Replace with daily quota tracking screenshot inside `/public/features/daily-quota.png`
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 2: Disposable Savings Pools */}
            <ScrollReveal>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 order-last lg:order-first">
                  {/* Clean Gray Bounded Placeholder Card */}
                  <div className="relative aspect-video w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-center p-8 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 to-zinc-950/50" />
                    <div className="z-10 flex flex-col items-center gap-3 text-center">
                      <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                        [ Disposable Pools Setup Screenshot Placeholder ]
                      </p>
                      <p className="text-[10px] text-zinc-600 max-w-xs">
                        Replace with savings allowance allocation screenshot inside `/public/features/savings-pool.png`
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)] text-[10px] font-bold text-[hsl(var(--primary))] uppercase">
                    Savings Safeguard
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-50">
                    Disposable Savings Pools
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Keep your goals safe. Lock away fixed recurring costs (dorm, bills, tuition reserves) and targeted savings targets immediately when your allowance drops. The app keeps these reserves completely separate from your day-to-day spending pool.
                  </p>
                  <ul className="space-y-3 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      Automated monthly cycle bill deductions
                    </li>
                    <li className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      Goal lockbox and status tracking
                    </li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 3: Secure Verification */}
            <ScrollReveal>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-5 space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)] text-[10px] font-bold text-[hsl(var(--primary))] uppercase">
                    Access Protection
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-50">
                    Secure Verification Safeguards
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    Protecting your credentials is key. ST-Finance locks modifications behind secure email verification. Toggling two-factor authorization, resetting passwords, and updating critical profile parameters triggers swift 6-digit email OTPs via Resend API to ensure your ledger remains strictly yours.
                  </p>
                  <ul className="space-y-3 text-xs text-zinc-300">
                    <li className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      Two-Factor Authentication (2FA) login guards
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      6-digit square verification input layouts
                    </li>
                  </ul>
                </div>

                <div className="lg:col-span-7">
                  {/* Clean Gray Bounded Placeholder Card */}
                  <div className="relative aspect-video w-full rounded-2xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-center p-8 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 to-zinc-950/50" />
                    <div className="z-10 flex flex-col items-center gap-3 text-center">
                      <div className="h-12 w-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
                        <Shield className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                        [ Secure 2FA / OTP Verification Screenshot Placeholder ]
                      </p>
                      <p className="text-[10px] text-zinc-600 max-w-xs">
                        Replace with secure 2FA dashboard screenshot inside `/public/features/verification.png`
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </section>

        {/* ─── FAQ section ─── */}
        <ScrollReveal>
          <section className="space-y-12 border-t border-zinc-900 pt-16">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/60 border border-zinc-800 text-[9px] font-bold text-zinc-400 uppercase">
                <HelpCircle className="h-3 w-3 text-[hsl(var(--primary))]" /> FAQ
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">Frequently Asked Questions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              <div className="ds-card p-6 space-y-2">
                <h4 className="text-xs font-bold text-zinc-100">How does the daily rolling quota work?</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  We calculate your total remaining budget and divide it by the days left in the cycle. If your limit is $10 and you spend $8 today, your remaining $2 rolls over and boosts tomorrow's limit to $12.
                </p>
              </div>
              <div className="ds-card p-6 space-y-2">
                <h4 className="text-xs font-bold text-zinc-100">Is my account data safe?</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Absolutely. Important security settings are protected behind 6-digit email verifications. Password modifications, email updates, and 2FA logins are secured by Resend API validation.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ─── Call To Action Footer Card ─── */}
        <ScrollReveal>
          <section className="rounded-3xl border border-zinc-800 bg-zinc-900/20 p-8 md:p-12 text-center max-w-4xl mx-auto space-y-6 relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 opacity-[0.02] rotate-[-15deg]">
              <Logo className="w-full h-full text-[hsl(var(--primary))]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-50">
              Ready to shield your monthly budget?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Join ST-Finance today and keep your allowance balanced. Start tracking with active safety boundaries.
            </p>
            <div className="flex justify-center pt-2">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-lg bg-[hsl(var(--primary))] text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)/0.2)]"
                >
                  Enter Workspace
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-lg bg-[hsl(var(--primary))] text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)/0.2)]"
                >
                  Create Free Account
                </Link>
              )}
            </div>
          </section>
        </ScrollReveal>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 px-4 md:px-8 text-center text-[10px] text-zinc-500 font-mono">
        <p>&copy; {new Date().getFullYear()} ST-Finance. All rights reserved. Built for Student Budget Safeguarding.</p>
      </footer>
    </div>
  );
}
