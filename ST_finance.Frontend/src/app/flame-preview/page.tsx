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
          CURVED ORGANIC FLAME TONGUES VERIFICATION
        </h1>
        <p className="text-sm text-zinc-400">
          Validating: Curved, tapered tongues emerging from middle body across multiple frames
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

      {/* Row 1: Streak = 7 at different motion frames */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-mono font-bold text-emerald-300 mb-3 border-b border-emerald-900/50 pb-1">
          Single Digit (Streak: {streakVal}) — Curved Motion Across Frames
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">1. Branch Formation (1.7s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={1.7} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">2. Fully Formed (2.0s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={2.0} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">3. Living Frame A (2.5s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={2.5} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">4. Living Frame B (3.2s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={3.2} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">5. Living Frame C (3.9s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={streakVal} size="md" manualTime={3.9} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Double-digit Streak = 14 */}
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-mono font-bold text-emerald-300 mb-3 border-b border-emerald-900/50 pb-1">
          Double-Digit (Streak: 14) — Curved Paths & Centered Contrast
        </h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">1. Formed (2.0s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={2.0} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">2. Living A (2.5s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={2.5} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">3. Living B (3.2s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={3.2} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">4. Living C (3.9s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={3.9} />
            </div>
          </div>

          <div className="flex flex-col items-center bg-zinc-950/80 border border-emerald-900/50 p-4 rounded-2xl">
            <span className="text-xs font-mono font-bold text-emerald-400 mb-2">5. Orb Check (0.5s)</span>
            <div className="w-44 h-52 flex items-center justify-center">
              <PixelFlameStreak streak={14} size="md" manualTime={0.5} />
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
