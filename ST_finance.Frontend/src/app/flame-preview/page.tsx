"use client";

import React, { useState } from "react";
import { PixelFlameStreak } from "@/components/ui/PixelFlameStreak";
import { StreakCelebrationModal } from "@/components/ui/StreakCelebrationModal";

export default function FlamePreviewPage() {
  const [showModal, setShowModal] = useState(false);
  const [streakVal, setStreakVal] = useState(7);

  return (
    <div className="min-h-screen bg-[#020704] text-white p-8 flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-black font-mono tracking-wider text-emerald-400">
          PIXEL FLAME STREAK TEST BENCH
        </h1>
        <p className="text-sm text-zinc-400">
          Visual verification across animation phases (single & multi-digit) & streak modal
        </p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-mono text-xs font-bold cursor-pointer"
          >
            Open Celebration Modal
          </button>
          <button
            onClick={() => setStreakVal((s) => (s === 7 ? 14 : s === 14 ? 42 : s === 42 ? 100 : 7))}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded font-mono text-xs font-bold cursor-pointer"
          >
            Current Streak: {streakVal} (Click to Cycle)
          </button>
        </div>
      </div>

      {/* Row 1: The 5 Phases (with streak = 7) */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-mono font-bold text-emerald-300 mb-3 border-b border-emerald-900/50 pb-1">
          Single Digit (Streak: 7) — 5 Animation Phases
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">1. Arcane Wind-up (0.3s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={7} size="md" manualTime={0.3} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">2. Charged Orb (0.8s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={7} size="md" manualTime={0.8} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">3. Mid-Eruption (1.25s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={7} size="md" manualTime={1.25} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">4. Branching Flame (1.75s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={7} size="md" manualTime={1.75} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">5. Living Flame (3.0s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={7} size="md" manualTime={3.0} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Multi-digit Legibility Check (Streak: 14) */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-mono font-bold text-emerald-300 mb-3 border-b border-emerald-900/50 pb-1">
          Two Digits (Streak: 14) — Legibility Across Core & Arcs
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">1. Wind-up (0.3s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={0.3} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">2. Charged Orb (0.8s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={0.8} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">3. Eruption (1.25s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={1.25} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">4. Branching (1.75s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={1.75} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">5. Living Flame (3.0s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={3.0} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Different Sizes (sm, md, lg) in Living Flame */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-mono font-bold text-emerald-300 mb-3 border-b border-emerald-900/50 pb-1">
          Size Variants (sm, md, lg) — Responsive Outline Scaling
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">Small (size="sm", 1.2px outline)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={30} size="sm" manualTime={3.0} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">Medium (size="md", 1.5px outline)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={30} size="md" manualTime={3.0} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">Large (size="lg", 2.0px outline)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={30} size="lg" manualTime={3.0} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal preview */}
      <StreakCelebrationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentStreak={streakVal}
        longestStreak={14}
      />
    </div>
  );
}
