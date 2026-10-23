"use client";

import React, { useEffect } from "react";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { X, Flame, Trophy, Sparkles } from "lucide-react";

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
        title: "Streak Started!",
        desc: "You logged today's expenses. Keep coming back daily to build your financial discipline!",
      };
    }
    if (currentStreak < 7) {
      return {
        title: `${currentStreak} Days on Fire!`,
        desc: "Consistent tracking is the secret to real financial freedom. Keep this flame alive!",
      };
    }
    if (currentStreak < 30) {
      return {
        title: `${currentStreak}-Day Streak!`,
        desc: "Amazing discipline! You're out-tracking 95% of students. Keep the momentum going!",
      };
    }
    return {
      title: "Legendary Streak!",
      desc: "Unstoppable habit! You've mastered daily finance management.",
    };
  };

  const message = getCelebrationMessage();

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm rounded-3xl border border-orange-500/30 bg-gradient-to-b from-[#1c120c] via-[#140d09] to-[#0a0705] p-6 text-center shadow-2xl shadow-orange-950/50 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Flame & Ember Stage */}
          <div className="relative flex items-center justify-center my-6">
            {/* Background radiant fire aura */}
            <div className="absolute w-36 h-36 rounded-full bg-gradient-to-t from-orange-600/30 via-amber-500/20 to-transparent blur-2xl pointer-events-none" />

            {/* Floating embers */}
            <div className="absolute -top-3 left-1/3 w-2 h-2 rounded-full bg-amber-400 animate-ember pointer-events-none" style={{ animationDelay: "0.2s" }} />
            <div className="absolute -top-6 right-1/3 w-1.5 h-1.5 rounded-full bg-orange-500 animate-ember pointer-events-none" style={{ animationDelay: "0.7s" }} />
            <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-yellow-300 animate-ember pointer-events-none" style={{ animationDelay: "1.1s" }} />

            {/* Central burning flame graphic */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-600/20 to-red-600/10 border border-orange-500/40 shadow-inner animate-flame-flicker">
                <span className="text-6xl select-none filter drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]">
                  🔥
                </span>
              </div>

              {/* Number overlay pill */}
              <div className="mt-[-18px] z-10 px-4 py-0.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-black font-black text-2xl font-mono shadow-lg shadow-orange-500/50 border-2 border-[#1c120c]">
                {currentStreak}
              </div>
            </div>
          </div>

          {/* Record Chip */}
          {isNewRecord && currentStreak > 1 ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              New All-Time Record!
            </div>
          ) : longestStreak > 0 ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-medium mb-2">
              <Trophy className="w-3 h-3 text-amber-500/80" />
              Best streak: {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </div>
          ) : null}

          {/* Headline & Body */}
          <h3 className="text-xl font-black text-white tracking-tight">
            {message.title}
          </h3>
          <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {message.desc}
          </p>

          {/* Action button */}
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-black font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4 fill-black" />
            Keep it Burning!
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
