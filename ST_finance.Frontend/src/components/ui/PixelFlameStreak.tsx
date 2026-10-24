"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface PixelFlameStreakProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
}

// 5 columns x 7 rows 8-bit bitmap font for digits 0-9
const DIGIT_BITMAPS: Record<string, number[]> = {
  "0": [
    0b01110,
    0b10001,
    0b10011,
    0b10101,
    0b11001,
    0b10001,
    0b01110,
  ],
  "1": [
    0b00100,
    0b01100,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b01110,
  ],
  "2": [
    0b01110,
    0b10001,
    0b00001,
    0b00110,
    0b01000,
    0b10000,
    0b11111,
  ],
  "3": [
    0b11110,
    0b00001,
    0b00001,
    0b01110,
    0b00001,
    0b00001,
    0b11110,
  ],
  "4": [
    0b00010,
    0b00110,
    0b01010,
    0b10010,
    0b11111,
    0b00010,
    0b00010,
  ],
  "5": [
    0b11111,
    0b10000,
    0b11110,
    0b00001,
    0b00001,
    0b10001,
    0b01110,
  ],
  "6": [
    0b01110,
    0b10000,
    0b11110,
    0b10001,
    0b10001,
    0b10001,
    0b01110,
  ],
  "7": [
    0b11111,
    0b00001,
    0b00010,
    0b00100,
    0b01000,
    0b01000,
    0b01000,
  ],
  "8": [
    0b01110,
    0b10001,
    0b10001,
    0b01110,
    0b10001,
    0b10001,
    0b01110,
  ],
  "9": [
    0b01110,
    0b10001,
    0b10001,
    0b01111,
    0b00001,
    0b00010,
    0b01100,
  ],
};

// Clean 8-shade ST-Finance Volt Green palette:
// Transparent -> Dark Emerald Edge -> Vivid Emerald -> Signature Volt -> Bright Lime -> Cyber Mint -> Incandescent Core
const FLAME_PALETTE: [number, number, number, number][] = [
  [0, 0, 0, 0],         // 0: transparent
  [2, 38, 22, 240],     // 1: dark emerald border
  [5, 78, 44, 255],     // 2: forest green
  [10, 138, 75, 255],   // 3: vivid emerald
  [34, 197, 94, 255],   // 4: signature ST-Finance volt
  [74, 222, 128, 255],  // 5: electric lime-volt
  [134, 239, 172, 255], // 6: cyber mint
  [240, 253, 244, 255], // 7: incandescent white-mint
];

export function PixelFlameStreak({
  streak,
  size = "md",
  interactive = true,
  className = "",
}: PixelFlameStreakProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStoked, setIsStoked] = useState(false);
  const stokeFuelRef = useRef<number>(0);

  const dimensions = {
    sm: { w: 40, h: 56, cssW: "w-28", cssH: "h-40" },
    md: { w: 48, h: 64, cssW: "w-36", cssH: "h-48" },
    lg: { w: 56, h: 74, cssW: "w-44", cssH: "h-58" },
  }[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    stokeFuelRef.current = 24;
    setIsStoked(true);
    setTimeout(() => setIsStoked(false), 800);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const { w: W, h: H } = dimensions;
    canvas.width = W;
    canvas.height = H;

    const fireBuffer = new Uint8Array(W * H);
    let animationFrameId: number;
    let lastTime = 0;
    let frameCount = 0;
    const targetFps = 34;
    const frameInterval = 1000 / targetFps;

    // Geometry of the Flame Symbol & Starting Orb
    const cx = Math.floor(W / 2);
    const orbCenterY = Math.floor(H * 0.62);
    const orbRadius = Math.floor(W * 0.28);
    const flameBaseY = Math.floor(H * 0.84);
    const flameTipY = Math.floor(H * 0.12);

    const numStr = Math.max(0, streak).toString();

    // Scale digits to sit comfortably in the rounded base of the flame
    let digitScale = 2;
    if (numStr.length >= 3) {
      digitScale = 1;
    } else if (numStr.length === 1 && W >= 48) {
      digitScale = 2;
    }

    const digitWidth = 5 * digitScale;
    const digitSpacing = 1 * digitScale;
    const totalNumWidth = numStr.length * digitWidth + (numStr.length - 1) * digitSpacing;
    const totalNumHeight = 7 * digitScale;

    // Number sits in the belly of the flame / center of the orb
    const numStartX = Math.floor(cx - totalNumWidth / 2);
    const numStartY = Math.floor(orbCenterY - totalNumHeight / 2);

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = time - lastTime;
      if (delta < frameInterval) return;
      lastTime = time - (delta % frameInterval);

      frameCount++;

      const isBoosted = stokeFuelRef.current > 0;
      if (isBoosted) {
        stokeFuelRef.current--;
      }

      // Morph Factor:
      // Frame 0..16: Starts as a clean circular orb
      // Frame 17..36: Ignites upward into the iconic flame symbol
      // Frame 36+: Steady burning flame symbol
      let morph = 1.0;
      if (frameCount < 16) {
        morph = 0.0;
      } else if (frameCount < 36) {
        const p = (frameCount - 16) / 20;
        morph = Math.sin(p * Math.PI * 0.5);
      } else {
        morph = 1.0;
      }

      const t = time * 0.003;
      // Natural flame tip sway
      const tipSway = (Math.sin(t * 3.5) * 2.2 + Math.sin(t * 6.0) * 1.0) * morph;

      // 1. Build the crisp geometric mask: Orb (morph=0) -> Flame Symbol (morph=1)
      const inMask = new Uint8Array(W * H);
      const isBorder = new Uint8Array(W * H);

      for (let y = 0; y < H; y++) {
        let currentHalfW = 0;
        let lineCx = cx;

        if (morph < 1.0) {
          // Circle Orb shape
          const dy = y - orbCenterY;
          if (Math.abs(dy) <= orbRadius) {
            currentHalfW = Math.sqrt(orbRadius * orbRadius - dy * dy);
          }
        }

        if (morph > 0.0 && y >= flameTipY && y <= flameBaseY) {
          // Iconic Flame Symbol shape: rounded bulbous belly tapering to a sharp tip
          const normY = (y - flameTipY) / (flameBaseY - flameTipY); // 0 at tip, 1 at base
          const bulb = Math.sin(normY * Math.PI * 0.88);
          const flameW = orbRadius * (1.18 * bulb * Math.pow(normY, 0.42));

          // Tip sways organically
          const lineSway = tipSway * (1 - normY);
          lineCx = cx + lineSway;

          // Blend between circle orb and flame symbol
          currentHalfW = (1 - morph) * currentHalfW + morph * flameW;
        }

        if (currentHalfW > 0.5) {
          const leftX = Math.max(0, Math.round(lineCx - currentHalfW));
          const rightX = Math.min(W - 1, Math.round(lineCx + currentHalfW));

          for (let x = leftX; x <= rightX; x++) {
            inMask[y * W + x] = 1;
            // Detect outer 1px border
            if (x === leftX || x === rightX || y === flameBaseY || y === flameTipY) {
              isBorder[y * W + x] = 1;
            }
          }
        }
      }

      // 2. Burning Heat Simulation inside the Mask
      for (let y = 1; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (!inMask[idx]) {
            fireBuffer[idx] = 0;
            continue;
          }

          if (isBorder[idx]) {
            fireBuffer[idx] = 1; // Dark emerald crisp edge
            continue;
          }

          // Distance from vertical center of the flame at this row
          const distFromCenter = Math.abs(x - cx) / orbRadius;

          // Moving upward flame heat waves
          const heatWave = Math.sin(y * 0.4 - t * 7 + x * 0.25) * 0.8;
          const flicker = (Math.sin(t * 12 + x * 0.5) + 1) * 0.4;
          const boost = isBoosted ? 1.5 : 0;

          // Hot inner core, cooling toward the edges
          let heat = Math.floor(
            6.2 - distFromCenter * 3.5 + heatWave + flicker + boost
          );

          // Base of the flame has maximum fuel
          if (y >= orbCenterY && y <= flameBaseY - 2) {
            heat = Math.max(heat, Math.floor(5.5 - distFromCenter * 2.0 + flicker));
          }

          // Tip of flame flickers sharply
          if (y < flameTipY + 6) {
            heat = Math.random() < 0.7 ? Math.min(4, heat) : 0;
          }

          fireBuffer[idx] = Math.max(1, Math.min(7, heat));
        }
      }

      // 3. Render ImageData
      const imgData = ctx.createImageData(W, H);
      const data = imgData.data;

      for (let i = 0; i < fireBuffer.length; i++) {
        const heat = fireBuffer[i];
        const color = FLAME_PALETTE[heat] || FLAME_PALETTE[0];
        const px = i * 4;
        data[px] = color[0];
        data[px + 1] = color[1];
        data[px + 2] = color[2];
        data[px + 3] = color[3];
      }

      // 4. Clean Pixel Sparks breaking off the tip
      if (morph > 0.6) {
        const tipX = Math.round(cx + tipSway);
        const sparkY = flameTipY - Math.floor((frameCount % 12) * 0.6);
        if (sparkY >= 0 && sparkY < flameTipY && tipX >= 0 && tipX < W) {
          const sIdx = (sparkY * W + tipX) * 4;
          data[sIdx] = 74;
          data[sIdx + 1] = 222;
          data[sIdx + 2] = 128;
          data[sIdx + 3] = 220;
        }
      }

      // 5. Stamp the Pixelated Number in the Belly of the Flame Symbol
      const shimmerY = Math.round(Math.sin(time * 0.004) * 0.8);
      const curStartY = numStartY + shimmerY;

      // Pass 1: Crisp Dark Pixel Outline for Instant Readability
      for (let i = 0; i < numStr.length; i++) {
        const digit = numStr[i];
        const bitmap = DIGIT_BITMAPS[digit] || DIGIT_BITMAPS["0"];
        const dX = numStartX + i * (digitWidth + digitSpacing);

        for (let r = 0; r < 7; r++) {
          const rowBits = bitmap[r];
          for (let c = 0; c < 5; c++) {
            if ((rowBits >> (4 - c)) & 1) {
              const baseX = dX + c * digitScale;
              const baseY = curStartY + r * digitScale;

              for (let oy = -1; oy <= digitScale; oy++) {
                for (let ox = -1; ox <= digitScale; ox++) {
                  const px = baseX + ox;
                  const py = baseY + oy;
                  if (px >= 0 && px < W && py >= 0 && py < H) {
                    const idx = (py * W + px) * 4;
                    data[idx] = 2;
                    data[idx + 1] = 24;
                    data[idx + 2] = 12;
                    data[idx + 3] = 245;
                  }
                }
              }
            }
          }
        }
      }

      // Pass 2: Bright Incandescent Mint-White Glyph Fill
      for (let i = 0; i < numStr.length; i++) {
        const digit = numStr[i];
        const bitmap = DIGIT_BITMAPS[digit] || DIGIT_BITMAPS["0"];
        const dX = numStartX + i * (digitWidth + digitSpacing);

        for (let r = 0; r < 7; r++) {
          const rowBits = bitmap[r];
          for (let c = 0; c < 5; c++) {
            if ((rowBits >> (4 - c)) & 1) {
              const baseX = dX + c * digitScale;
              const baseY = curStartY + r * digitScale;

              for (let sy = 0; sy < digitScale; sy++) {
                for (let sx = 0; sx < digitScale; sx++) {
                  const px = baseX + sx;
                  const py = baseY + sy;
                  if (px >= 0 && px < W && py >= 0 && py < H) {
                    const idx = (py * W + px) * 4;
                    data[idx] = 240;
                    data[idx + 1] = 253;
                    data[idx + 2] = 244;
                    data[idx + 3] = 255;
                  }
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, streak]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none group cursor-pointer ${className}`}
      onClick={handleStoke}
      title={interactive ? "Click or tap to stoke!" : undefined}
    >
      {/* Subtle Neon Volt Aura behind the Flame Symbol */}
      <div
        className={`absolute w-32 h-40 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none transition-all duration-300 ${
          isStoked ? "scale-115 opacity-100" : "scale-100 opacity-80"
        }`}
      />

      {/* Crisp Pixel Canvas */}
      <canvas
        ref={canvasRef}
        className={`${dimensions.cssW} ${dimensions.cssH} [image-rendering:pixelated] [image-rendering:crisp-edges] transition-transform duration-200 active:scale-95`}
      />

      {/* Pill Badge */}
      <div className="mt-[-2px] z-10 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.3)] flex items-center gap-1.5 backdrop-blur-xs">
        <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-xs" />
        {streak === 1 ? "DAY STREAK" : "DAYS BURNING"}
      </div>
    </div>
  );
}
