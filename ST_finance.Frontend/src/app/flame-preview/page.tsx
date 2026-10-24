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
          TARGETED FLAME POLISH VERIFICATION
        </h1>
        <p className="text-sm text-zinc-400">
          Testing: (1) Zero green block artifacts during transition & (2) Natural flame crown tips without long central spike
        </p>
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-mono text-xs font-bold cursor-pointer"
          >
            Open Celebration Modal
          </button>
          <button
            onClick={() => setStreakVal((s) => (s === 7 ? 14 : s === 14 ? 42 : 7))}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded font-mono text-xs font-bold cursor-pointer"
          >
            Streak: {streakVal} (Click to Cycle)
          </button>
        </div>
      </div>

      {/* Row 1: The 5 Critical Transition & Flame Stages */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-mono font-bold text-emerald-300 mb-3 border-b border-emerald-900/50 pb-1">
          Stage Verification (Streak: {streakVal}) — Check Background & Flame Crown
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {/* Stage 1: Orb Before Eruption */}
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">1. Orb Before Eruption (0.8s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={0.8} />
            </div>
          </div>

          {/* Stage 2: Peak Flash / Pre-Eruption */}
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">2. Flash Core (0.96s) [No Blocks!]</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={0.96} />
            </div>
          </div>

          {/* Stage 3: Mid-Transition Eruption */}
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">3. Mid-Transition (1.20s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={1.20} />
            </div>
          </div>

          {/* Stage 4: First Fully Formed Flame */}
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">4. Formed Flame (1.70s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={1.70} />
            </div>
          </div>

          {/* Stage 5: Living Flame Crown */}
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">5. Living Flame (3.0s) [No Spike!]</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={3.0} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Double-digit Multi-stage Check */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-mono font-bold text-emerald-300 mb-3 border-b border-emerald-900/50 pb-1">
          Double-Digit (Streak: 14) — Verified Clean Background & Multi-Tongue Crown
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">1. Orb (0.8s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={0.8} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">2. Flash (0.96s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={0.96} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">3. Transition (1.20s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={1.20} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">4. Formed (1.70s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={1.70} />
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
