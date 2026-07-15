"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
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
  X,
  ChevronLeft,
  ZoomIn,
} from "lucide-react";

const LIGHTBOX_IMAGES = [
  {
    src: "/features/dashboard-desktop.png",
    title: "ST-Finance Dashboard - Desktop View",
    description: "Your financial central command. Monitor your balance, view dynamic daily safe-to-spend quotas, and track recent transactions at a glance."
  },
  {
    src: "/features/Dashboard-Mobile-v2.png",
    title: "ST-Finance Dashboard - Mobile View",
    description: "Optimized for on-the-go tracking. Check your rolling daily allowance limit and record transactions right at the checkout counter."
  },
  {
    src: "/features/Transactions-Desktop.png",
    title: "Transactions History - Desktop View",
    description: "Detailed chronological ledger of all income, expenses, and internal account transfers with powerful filtering options."
  },
  {
    src: "/features/Transactions-Mobile.png",
    title: "Transactions History - Mobile View",
    description: "Review, filter, and track transactions easily on the go with our fully optimized mobile ledger view."
  },
  {
    src: "/features/Desktop-Savings-Goals.png",
    title: "Savings Goals Active - Desktop",
    description: "Define targets for dorm, tuition, or travel. The app automatically partitions these reserves from your daily spending pool."
  },
  {
    src: "/features/Completed-Goals-Desktop.png",
    title: "Completed Goals Archive",
    description: "Keep track of your financial milestones. Review past achievements to stay motivated."
  },
  {
    src: "/features/User-profile-management-desktop.png",
    title: "Secure Profile & OTP Verification",
    description: "Protecting your settings with 6-digit email OTP verifications via Resend API to keep your database strictly secure."
  },
  {
    src: "/features/Multiple-Accounts-Desktop.png",
    title: "Multi-Accounts Management - Desktop View",
    description: "Consolidate checking, savings, student cards, and cash. Track combined net balance in real-time."
  },
  {
    src: "/features/Accounts-Mobile-v2.png",
    title: "Multi-Accounts Management - Mobile View",
    description: "Check your wallets and balances instantly on mobile. Switch between different accounts and log transfers with one tap."
  },
  {
    src: "/features/Recuring-schedules-desktop.png",
    title: "Recurring Schedules & Automation",
    description: "Set up automated recurring transactions for bills or allowances to prevent any end-of-month surprises."
  }
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const openLightbox = (src: string) => {
    const index = LIGHTBOX_IMAGES.findIndex(img => img.src.toLowerCase() === src.toLowerCase());
    if (index !== -1) {
      setActiveImageIndex(index);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (activeImageIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeImageIndex]);

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImageIndex(null);
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev !== null ? (prev + 1) % LIGHTBOX_IMAGES.length : null));
      } else if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev !== null ? (prev - 1 + LIGHTBOX_IMAGES.length) % LIGHTBOX_IMAGES.length : null));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex]);


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

        {/* ─── Hero App Showcase ─── */}
        <ScrollReveal>
          <section className="relative mt-12 w-full max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--primary))] mb-2">Designed for modern student lifestyles</p>
              <h2 className="text-2xl font-black tracking-tight text-zinc-100">Realistic Multi-Platform Workspace</h2>
            </div>

            {/* Overlapping Deck */}
            <div className="relative aspect-[16/10] w-full bg-zinc-950/20 rounded-2xl border border-zinc-900/50 p-4 md:p-6 overflow-visible flex items-center justify-center">

              {/* Back Card (Transactions page peeking out) */}
              <div 
                onClick={() => openLightbox("/features/Transactions-Desktop.png")}
                className="absolute -left-6 -top-6 w-[58%] aspect-[16/10] rounded-xl overflow-hidden border border-zinc-800/80 shadow-2xl opacity-45 hover:opacity-100 transition-all duration-300 transform -rotate-3 translate-x-2 hover:scale-[1.02] cursor-zoom-in z-10 group/txs"
              >
                <div className="bg-zinc-900/90 h-6 border-b border-zinc-800" />
                <div className="relative w-full h-[calc(100%-1.5rem)] bg-zinc-950">
                  <Image src="/features/Transactions-Desktop.png" alt="Transactions History" fill className="object-cover object-top" quality={60} />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/txs:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 text-zinc-50 z-30">
                    <ZoomIn className="h-4.5 w-4.5 text-[hsl(var(--primary))]" />
                    <span className="text-[10px] font-bold font-sans">Enlarge Ledger</span>
                  </div>
                </div>
              </div>

              {/* Main Desktop Browser Frame */}
              <div 
                onClick={() => openLightbox("/features/dashboard-desktop.png")}
                className="relative w-[90%] aspect-[16/10] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] z-20 transform transition-all duration-500 hover:scale-[1.01] cursor-zoom-in group/main"
              >
                {/* Browser Chrome Header */}
                <div className="bg-zinc-900 h-8 flex items-center px-4 gap-2 border-b border-zinc-800 select-none">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                    <div className="h-3 w-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 max-w-sm mx-auto bg-zinc-950 h-5 rounded-md border border-zinc-800/80 flex items-center justify-center text-[10px] font-mono text-zinc-500">
                    ST-Finance
                  </div>
                </div>
                {/* Browser Content */}
                <div className="relative w-full h-[calc(100%-2rem)]">
                  <Image src="/features/dashboard-desktop.png" alt="ST-Finance Dashboard - Desktop View" fill className="object-cover object-top" quality={95} priority />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/main:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-zinc-100 z-30">
                    <ZoomIn className="h-6 w-6 text-[hsl(var(--primary))]" />
                    <span className="text-xs font-bold font-sans">Click to Enlarge</span>
                  </div>
                </div>
              </div>

              {/* Overlapping Mobile Phone View */}
              <div 
                onClick={() => openLightbox("/features/Dashboard-Mobile-v2.png")}
                className="absolute -right-6 -bottom-8 w-[25%] min-w-[160px] aspect-[9/18.2] rounded-[2rem] overflow-hidden border-4 border-zinc-700 bg-zinc-950 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.9)] z-30 transform rotate-2 hover:rotate-0 hover:scale-[1.03] transition-all duration-305 cursor-zoom-in group/phone"
              >
                {/* Phone Speaker Notch */}
                <div className="absolute top-0 inset-x-0 h-4 bg-zinc-950 z-40 flex items-center justify-center">
                  <div className="w-12 h-2.5 bg-zinc-900 rounded-b-lg" />
                </div>
                {/* Phone Content */}
                <div className="relative w-full aspect-[778/1670] mt-4">
                  <Image src="/features/Dashboard-Mobile-v2.png" alt="ST-Finance Dashboard - Mobile View" fill className="object-cover object-top" quality={90} />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/phone:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1 text-zinc-50 z-30">
                    <ZoomIn className="h-4 w-4 text-[hsl(var(--primary))]" />
                    <span className="text-[10px] font-bold font-sans">Enlarge</span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </ScrollReveal>

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
                  {/* Overlapping Mockup */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl border border-zinc-900/50 bg-zinc-950/20 p-4 md:p-6 overflow-visible flex items-center justify-center">

                    {/* Desktop Browser mockup */}
                    <div 
                      onClick={() => openLightbox("/features/dashboard-desktop.png")}
                      className="relative w-[95%] aspect-[16/10] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl hover:scale-[1.01] transition-transform duration-300 cursor-zoom-in group/desktop1"
                    >
                      <div className="bg-zinc-900 h-6 flex items-center px-3 gap-1.5 border-b border-zinc-800">
                        <div className="h-2 w-2 rounded-full bg-red-500/60" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                        <div className="h-2 w-2 rounded-full bg-green-500/60" />
                      </div>
                      <div className="relative w-full h-[calc(100%-1.5rem)]">
                        <Image src="/features/dashboard-desktop.png" alt="Daily Quota - Desktop" fill className="object-cover object-top" quality={90} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/desktop1:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-zinc-100 z-30">
                          <ZoomIn className="h-5 w-5 text-[hsl(var(--primary))]" />
                          <span className="text-xs font-bold font-sans">Click to Enlarge</span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Mockup overlapping */}
                    <div 
                      onClick={() => openLightbox("/features/Dashboard-Mobile-v2.png")}
                      className="absolute -left-4 -bottom-4 w-[28%] min-w-[130px] aspect-[9/18.2] rounded-[1.5rem] overflow-hidden border-2 border-zinc-700 bg-zinc-950 shadow-[0_15px_30px_rgba(0,0,0,0.8)] z-30 transform -rotate-2 hover:rotate-0 hover:scale-[1.03] transition-all duration-300 cursor-zoom-in group/mobile1"
                    >
                      <div className="relative w-full aspect-[778/1670] mt-3">
                        <Image src="/features/Dashboard-Mobile-v2.png" alt="Daily Quota - Mobile" fill className="object-cover object-top" quality={80} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/mobile1:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1 text-zinc-50 z-30">
                          <ZoomIn className="h-4 w-4 text-[hsl(var(--primary))]" />
                          <span className="text-[10px] font-bold font-sans">Enlarge</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 2: Disposable Savings Pools */}
            <ScrollReveal>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 order-last lg:order-first">
                  {/* Overlapping Desktop Mockups (Active Goals overlapping Completed Goals) */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl border border-zinc-900/50 bg-zinc-950/20 p-4 md:p-6 overflow-visible flex items-center justify-center">

                    {/* Back Browser Card (Completed Goals) */}
                    <div 
                      onClick={() => openLightbox("/features/Completed-Goals-Desktop.png")}
                      className="absolute -left-6 -top-6 w-[90%] aspect-[16/10] rounded-xl overflow-hidden border border-zinc-800/80 shadow-xl opacity-50 hover:opacity-100 transition-all duration-300 transform -rotate-1 scale-95 z-10 hover:scale-[0.97] cursor-zoom-in group/completed"
                    >
                      <div className="bg-zinc-900 h-6 flex items-center px-3 border-b border-zinc-800">
                        <div className="h-2 w-2 rounded-full bg-red-500/40" />
                        <span className="ml-3 text-[8px] font-mono text-zinc-600">Completed Archive</span>
                      </div>
                      <div className="relative w-full h-[calc(100%-1.5rem)]">
                        <Image src="/features/Completed-Goals-Desktop.png" alt="Savings Goals Completed - Desktop" fill className="object-cover object-top" quality={80} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/completed:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 text-zinc-50 z-30">
                          <ZoomIn className="h-4 w-4 text-[hsl(var(--primary))]" />
                          <span className="text-[10px] font-bold font-sans">Enlarge Archive</span>
                        </div>
                      </div>
                    </div>

                    {/* Front Browser Card (Active Goals) */}
                    <div 
                      onClick={() => openLightbox("/features/Desktop-Savings-Goals.png")}
                      className="relative w-[95%] aspect-[16/10] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl z-20 hover:scale-[1.01] transition-transform duration-300 cursor-zoom-in group/active"
                    >
                      <div className="bg-zinc-900 h-6 flex items-center px-3 gap-1.5 border-b border-zinc-800">
                        <div className="h-2 w-2 rounded-full bg-red-500/60" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                        <div className="h-2 w-2 rounded-full bg-green-500/60" />
                      </div>
                      <div className="relative w-full h-[calc(100%-1.5rem)]">
                        <Image src="/features/Desktop-Savings-Goals.png" alt="Savings Goals Active - Desktop" fill className="object-cover object-top" quality={90} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/active:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-zinc-100 z-30">
                          <ZoomIn className="h-5 w-5 text-[hsl(var(--primary))]" />
                          <span className="text-xs font-bold font-sans">Click to Enlarge</span>
                        </div>
                      </div>
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
                  {/* Single Desktop Mockup - No mobile screenshot provided */}
                  <div className="relative aspect-[16/10] w-full rounded-2xl border border-zinc-900/50 bg-zinc-950/20 p-4 md:p-6 overflow-visible flex items-center justify-center">

                    <div 
                      onClick={() => openLightbox("/features/User-profile-management-desktop.png")}
                      className="relative w-[98%] aspect-[16/10] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl hover:scale-[1.01] transition-transform duration-300 cursor-zoom-in group/profile"
                    >
                      <div className="bg-zinc-900 h-6 flex items-center px-3 gap-1.5 border-b border-zinc-800">
                        <div className="h-2 w-2 rounded-full bg-red-500/60" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                        <div className="h-2 w-2 rounded-full bg-green-500/60" />
                      </div>
                      <div className="relative w-full h-[calc(100%-1.5rem)]">
                        <Image src="/features/User-profile-management-desktop.png" alt="Secure Verification - Desktop" fill className="object-cover object-top" quality={90} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/profile:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-zinc-100 z-30">
                          <ZoomIn className="h-5 w-5 text-[hsl(var(--primary))]" />
                          <span className="text-xs font-bold font-sans">Click to Enlarge</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </section>

        {/* ─── Unified Ledger & Automation Section ─── */}
        <ScrollReveal>
          <section className="space-y-16 border-t border-zinc-900 pt-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--primary))]">
                Unified Ecosystem
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-50">
                Advanced Ledger & Automation Engine
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
                Consolidate your entire student financial stack. Control multiple active wallets and automate recurring payments to shield your allowance proactively.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Feature A: Multi-Accounts */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)] text-[10px] font-bold text-[hsl(var(--primary))] uppercase">
                    Accounts & Wallets
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100">Unified Multi-Account Integration</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Track all your spending pools in one interface. Whether it is cash on hand, checking accounts, student cards, or mobile wallets (like GPay), stay aware of your total combined net balance in real-time.
                  </p>
                </div>
                
                {/* Overlapping Mockup */}
                <div className="relative aspect-[16/9] w-full rounded-2xl border border-zinc-900/50 bg-zinc-950/20 p-4 overflow-visible flex items-center justify-center group">
                  {/* Desktop Browser mockup */}
                  <div 
                    onClick={() => openLightbox("/features/Multiple-Accounts-Desktop.png")}
                    className="relative w-[95%] aspect-[16/9] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl transition-all duration-300 group-hover:scale-[1.01] cursor-zoom-in group/accounts"
                  >
                    {/* Browser Chrome Header */}
                    <div className="bg-zinc-900 h-6 flex items-center px-3 gap-1.5 border-b border-zinc-800 select-none">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500/60" />
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/60" />
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500/60" />
                      </div>
                      <div className="flex-1 max-w-[120px] mx-auto bg-zinc-950 h-3.5 rounded border border-zinc-800/80 flex items-center justify-center text-[7px] font-mono text-zinc-500">
                        st-finance.com/accounts
                      </div>
                    </div>
                    {/* Browser Content */}
                    <div className="relative w-full h-[calc(100%-1.5rem)]">
                      <Image src="/features/Multiple-Accounts-Desktop.png" alt="Multi-Accounts Management" fill className="object-cover object-top" quality={90} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/accounts:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 text-zinc-100 z-30">
                        <ZoomIn className="h-5 w-5 text-[hsl(var(--primary))]" />
                        <span className="text-xs font-bold font-sans">Click to Enlarge</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Mockup overlapping */}
                  <div 
                    onClick={(e) => { e.stopPropagation(); openLightbox("/features/Accounts-Mobile-v2.png"); }}
                    className="absolute -left-4 -bottom-4 w-[28%] min-w-[110px] aspect-[9/18.2] rounded-[1.2rem] overflow-hidden border-2 border-zinc-700 bg-zinc-950 shadow-[0_15px_30px_rgba(0,0,0,0.8)] z-30 transform -rotate-2 hover:rotate-0 hover:scale-[1.03] transition-all duration-300 cursor-zoom-in group/mobile-accounts"
                  >
                    <div className="relative w-full aspect-[780/1688] mt-2.5">
                      <Image src="/features/Accounts-Mobile-v2.png" alt="Accounts - Mobile" fill className="object-cover object-top" quality={80} />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/mobile-accounts:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1 text-zinc-50 z-30">
                        <ZoomIn className="h-4 w-4 text-[hsl(var(--primary))]" />
                        <span className="text-[10px] font-bold font-sans">Enlarge</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature B: Recurring Schedules */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[hsl(var(--primary)/0.08)] border border-[hsl(var(--primary)/0.2)] text-[10px] font-bold text-[hsl(var(--primary))] uppercase">
                    Automation Engine
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100">Automated Recurring Cycles</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Automate deposits and bills to eliminate surprises. Set up scholarship or freelance retainers alongside recurring rent, bills, or mobile data plans to automatically isolate funds before calculating your daily safe-to-spend limit.
                  </p>
                </div>

                {/* Browser Mockup */}
                <div className="relative aspect-[16/9] w-full rounded-2xl border border-zinc-900/50 bg-zinc-950/20 p-4 overflow-hidden flex items-center justify-center group">
                  <div 
                    onClick={() => openLightbox("/features/Recuring-schedules-desktop.png")}
                    className="relative w-[95%] aspect-[16/9] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl transition-all duration-300 group-hover:scale-[1.01] cursor-zoom-in group/recurring"
                  >
                    {/* Browser Chrome Header */}
                    <div className="bg-zinc-900 h-6 flex items-center px-3 gap-1.5 border-b border-zinc-800 select-none">
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500/60" />
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/60" />
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500/60" />
                      </div>
                      <div className="flex-1 max-w-[120px] mx-auto bg-zinc-950 h-3.5 rounded border border-zinc-800/80 flex items-center justify-center text-[7px] font-mono text-zinc-500">
                        st-finance.com/recurring
                      </div>
                    </div>
                    {/* Browser Content */}
                    <div className="relative w-full h-[calc(100%-1.5rem)]">
                      <Image src="/features/Recuring-schedules-desktop.png" alt="Recurring Schedules Management" fill className="object-cover object-top" quality={90} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/recurring:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 text-zinc-100 z-30">
                        <ZoomIn className="h-5 w-5 text-[hsl(var(--primary))]" />
                        <span className="text-[10px] font-bold font-sans">Click to Enlarge</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

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

      {/* ─── Lightbox Modal ─── */}
      {activeImageIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-4 md:p-8 animate-fade-in transition-all duration-300"
          onClick={() => setActiveImageIndex(null)}
        >
          {/* Top Bar */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="text-xs font-mono text-zinc-400">
              {activeImageIndex + 1} / {LIGHTBOX_IMAGES.length}
            </div>
            <button 
              onClick={() => setActiveImageIndex(null)}
              className="p-2 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="relative flex-1 w-full max-w-7xl flex items-center justify-center my-4">
            {/* Left Control Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev !== null ? (prev - 1 + LIGHTBOX_IMAGES.length) % LIGHTBOX_IMAGES.length : null));
              }}
              className="absolute left-0 md:left-4 p-3 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors z-20"
              aria-label="Previous Image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Image Container */}
            <div 
              className="relative w-full h-[80%] max-w-[85vw] max-h-[70vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={LIGHTBOX_IMAGES[activeImageIndex].src}
                alt={LIGHTBOX_IMAGES[activeImageIndex].title}
                fill
                className="object-contain animate-scale-in"
                quality={100}
                priority
              />
            </div>

            {/* Right Control Arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex((prev) => (prev !== null ? (prev + 1) % LIGHTBOX_IMAGES.length : null));
              }}
              className="absolute right-0 md:right-4 p-3 rounded-full bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 transition-colors z-20"
              aria-label="Next Image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Bottom Caption Card */}
          <div 
            className="w-full max-w-2xl bg-zinc-900/80 border border-zinc-800/80 p-6 rounded-2xl text-center space-y-2 z-10 backdrop-blur"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black tracking-tight text-zinc-50">
              {LIGHTBOX_IMAGES[activeImageIndex].title}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl mx-auto">
              {LIGHTBOX_IMAGES[activeImageIndex].description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
