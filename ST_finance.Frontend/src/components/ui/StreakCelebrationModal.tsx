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
}

export function StreakCelebrationModal({
  isOpen,
  onClose,
  currentStreak,
  longestStreak = 0,
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
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors z-20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Flame & Ember Stage */}
          <div className="relative flex items-center justify-center my-4">
            {/* Floating Pixel Embers rising around the flame */}
            <div
              className="absolute -top-3 left-[28%] w-1.5 h-1.5 bg-emerald-400 animate-ember pointer-events-none shadow-[0_0_6px_#22c55e]"
              style={{ animationDelay: "0.15s", animationDuration: "1.4s" }}
            />
            <div
              className="absolute -top-6 right-[26%] w-1.5 h-1.5 bg-lime-300 animate-ember pointer-events-none shadow-[0_0_6px_#86efac]"
              style={{ animationDelay: "0.65s", animationDuration: "1.8s" }}
            />
            <div
              className="absolute -top-1 left-[48%] w-1 h-1 bg-white animate-ember pointer-events-none shadow-[0_0_8px_#ffffff]"
              style={{ animationDelay: "1.05s", animationDuration: "1.2s" }}
            />
            <div
              className="absolute top-4 right-[22%] w-1 h-1 bg-emerald-300 animate-ember pointer-events-none"
              style={{ animationDelay: "0.45s", animationDuration: "1.6s" }}
            />

            {/* ST-Finance Green Pixelated Flame with Pixel Number */}
            <PixelFlameStreak streak={currentStreak} size="md" />
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

          {/* Action button */}
          <button
            onClick={onClose}
            className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-400 hover:from-emerald-400 hover:via-teal-300 hover:to-lime-300 text-black font-mono font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-black stroke-black" />
            Keep it Burning!
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
