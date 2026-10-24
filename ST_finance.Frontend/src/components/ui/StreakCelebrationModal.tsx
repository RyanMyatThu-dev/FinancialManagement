"use client";

import React, { useEffect } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { X, Flame, Trophy, Sparkles } from "lucide-react";
import { PixelFlameStreak } from "@/components/ui/PixelFlameStreak";

interface StreakCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak?: number;
  manualTime?: number;
}

export function StreakCelebrationModal({
  isOpen,
  onClose,
  currentStreak,
  longestStreak = 0,
  manualTime,
}: StreakCelebrationModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isNewRecord = currentStreak > 0 && currentStreak >= longestStreak;

  const getCelebrationMessage = () => {
    if (currentStreak === 1) {
      return {
        title: "Streak Sparked!",
        desc: "First daily entry logged. Keep returning each day to build rock-solid financial discipline!",
      };
    }
    if (currentStreak < 7) {
      return {
        title: `${currentStreak} Days on Fire!`,
        desc: "Consistent expense logging is the secret to total financial control. Keep this flame alive!",
      };
    }
    if (currentStreak < 30) {
      return {
        title: `${currentStreak}-Day Hot Streak!`,
        desc: "Incredible discipline! You're consistently out-budgeting 95% of students. Habit locked in!",
      };
    }
    return {
      title: "Legendary Flame!",
      desc: "Unstoppable habit! You have mastered daily student finance and budgeting discipline.",
    };
  };

  const message = getCelebrationMessage();

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#081e13] via-[#040e09] to-[#020504] p-6 text-center shadow-2xl shadow-emerald-950/70 animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Cyber Grid Background Overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"
            aria-hidden="true"
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-20 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Flame & Ember Stage */}
          <div className="relative flex items-center justify-center mt-2 mb-3">
            {/* Floating Pixel Embers rising around the flame */}
            <div
              className="absolute -top-3 left-[26%] w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ember pointer-events-none shadow-[0_0_8px_#22c55e]"
              style={{ animationDelay: "0.15s", animationDuration: "1.4s" }}
            />
            <div
              className="absolute -top-6 right-[24%] w-1.5 h-1.5 rounded-full bg-lime-300 animate-ember pointer-events-none shadow-[0_0_8px_#86efac]"
              style={{ animationDelay: "0.65s", animationDuration: "1.8s" }}
            />
            <div
              className="absolute -top-1 left-[48%] w-1 h-1 rounded-full bg-white animate-ember pointer-events-none shadow-[0_0_8px_#ffffff]"
              style={{ animationDelay: "1.05s", animationDuration: "1.2s" }}
            />
            <div
              className="absolute top-4 right-[20%] w-1 h-1 rounded-full bg-emerald-300 animate-ember pointer-events-none shadow-[0_0_6px_#86efac]"
              style={{ animationDelay: "0.45s", animationDuration: "1.6s" }}
            />

            {/* ST-Finance Green Pixelated Flame with Pixel Number */}
            <PixelFlameStreak streak={currentStreak} size="md" manualTime={manualTime} />
          </div>

          {/* Record Chip */}
          {isNewRecord && currentStreak > 1 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold tracking-wider uppercase mb-2 shadow-[0_0_12px_rgba(34,197,94,0.25)]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              New All-Time Record!
            </div>
          ) : longestStreak > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-zinc-400 text-[11px] font-mono font-medium mb-2">
              <Trophy className="w-3.5 h-3.5 text-emerald-400/90" />
              Best streak: {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </div>
          ) : null}

          {/* Headline & Body */}
          <h3 className="text-2xl font-black text-white tracking-tight">
            {message.title}
          </h3>
          <p className="mt-2 text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {message.desc}
          </p>

          {/* Action button: Authentic Border Box with Tactile Invert Hover */}
          <button
            onClick={onClose}
            className="group relative mt-6 w-full py-3.5 px-4 rounded-xl border border-emerald-500/50 bg-[#030d07] hover:bg-emerald-500 text-emerald-400 hover:text-black hover:border-emerald-400 font-mono font-bold text-xs uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 shadow-[0_0_12px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            <Flame className="w-4 h-4 transition-transform duration-150 group-hover:scale-110" />
            <span className="transition-transform duration-150 group-hover:-translate-x-1 opacity-60 group-hover:opacity-100">[</span>
            <span>Keep it Burning</span>
            <span className="transition-transform duration-150 group-hover:translate-x-1 opacity-60 group-hover:opacity-100">]</span>
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
