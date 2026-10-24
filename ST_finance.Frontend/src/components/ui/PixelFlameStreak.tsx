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

// ST-Finance Signature Neon Volt Green 16-shade palette:
// Transparent -> Dark Pine -> Vivid Emerald -> Neon Volt -> Cyber Mint -> Incandescent White
const VOLT_FIRE_PALETTE: [number, number, number, number][] = [
  [0, 0, 0, 0],         // 0: transparent
  [2, 24, 14, 180],     // 1: shadowy pine
  [4, 45, 26, 215],     // 2: dark forest
  [5, 72, 42, 240],     // 3: forest green
  [5, 105, 60, 255],    // 4: deep emerald
  [6, 142, 78, 255],    // 5: emerald
  [16, 180, 96, 255],   // 6: rich emerald
  [34, 197, 94, 255],   // 7: signature ST-Finance Neon Volt
  [52, 211, 110, 255],  // 8: electric lime-volt
  [74, 222, 128, 255],  // 9: bright neon volt
  [110, 231, 160, 255], // 10: cyber mint
  [150, 245, 190, 255], // 11: bright mint
  [187, 247, 208, 255], // 12: radiant mint
  [220, 252, 231, 255], // 13: phosphor white-mint
  [240, 253, 244, 255], // 14: incandescent white-mint
  [255, 255, 255, 255], // 15: pure white core
];

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function PixelFlameStreak({
  streak,
  size = "md",
  interactive = true,
  className = "",
}: PixelFlameStreakProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStoked, setIsStoked] = useState(false);
  const stokeFuelRef = useRef<number>(0);

  // Resolution of the retro pixel grid
  const dimensions = {
    sm: { w: 46, h: 60, cssW: "w-32", cssH: "h-40" },
    md: { w: 56, h: 72, cssW: "w-44", cssH: "h-56" },
    lg: { w: 66, h: 84, cssW: "w-56", cssH: "h-72" },
  }[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    stokeFuelRef.current = 24; // boost fire for 24 frames
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
    const sparks: Spark[] = [];
    const maxPaletteIdx = VOLT_FIRE_PALETTE.length - 1;

    let animationFrameId: number;
    let lastTime = 0;
    const targetFps = 32;
    const frameInterval = 1000 / targetFps;

    const numStr = Math.max(0, streak).toString();

    // Determine scale of pixel digits to fit naturally inside the flame
    let digitScale = 2;
    if (numStr.length >= 3) {
      digitScale = 1;
    } else if (numStr.length === 1 && W >= 56) {
      digitScale = 2;
    }

    const digitWidth = 5 * digitScale;
    const digitSpacing = 1 * digitScale;
    const totalNumWidth = numStr.length * digitWidth + (numStr.length - 1) * digitSpacing;
    const numStartX = Math.floor((W - totalNumWidth) / 2);
    const numStartY = Math.floor(H * 0.44);

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = time - lastTime;
      if (delta < frameInterval) return;
      lastTime = time - (delta % frameInterval);

      const isBoosted = stokeFuelRef.current > 0;
      if (isBoosted) {
        stokeFuelRef.current--;
      }

      // 1. Seed bottom base row with shaped flame envelope
      const wave = Math.sin(time * 0.005) * 0.8;
      for (let x = 0; x < W; x++) {
        // Distance from horizontal center: 0 in center, 1 at edges
        const distFromCenter = Math.abs(x - (W / 2 + wave * 2)) / (W / 2);

        // Teardrop / bell curve mask so fire shapes naturally like a flame
        if (distFromCenter < 0.72) {
          const envelope = Math.cos((distFromCenter / 0.72) * (Math.PI / 2));
          const noise = (Math.sin(time * 0.012 + x * 0.45) + 1) * 0.5;
          const heatBoost = isBoosted ? 3 : 0;

          // Hottest center base
          const baseHeat = Math.min(
            maxPaletteIdx,
            Math.floor((maxPaletteIdx - 1 + heatBoost) * Math.pow(envelope, 0.9) * (0.75 + 0.25 * noise))
          );

          fireBuffer[(H - 1) * W + x] = Math.random() < 0.92 ? baseHeat : 0;
          fireBuffer[(H - 2) * W + x] = Math.random() < 0.85 ? Math.max(0, baseHeat - 1) : 0;

          // Occasionally seed floating core sparks
          if (distFromCenter < 0.35 && Math.random() < (isBoosted ? 0.35 : 0.08)) {
            sparks.push({
              x: x + (Math.random() * 2 - 1),
              y: H - 4,
              vx: (Math.random() - 0.5) * 0.8 + wave * 0.4,
              vy: -(1.2 + Math.random() * 1.6 + (isBoosted ? 1.0 : 0)),
              life: 0,
              maxLife: 20 + Math.random() * 25,
            });
          }
        } else {
          fireBuffer[(H - 1) * W + x] = 0;
          fireBuffer[(H - 2) * W + x] = 0;
        }
      }

      // 2. Convection and turbulence heat step
      for (let y = 1; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const srcIdx = y * W + x;
          const heat = fireBuffer[srcIdx];
          if (heat === 0) continue;

          // Natural air decay: center decays slower to form tall flame tips
          const dist = Math.abs(x - W / 2) / (W / 2);
          const decayProb = dist > 0.4 ? 0.6 : 0.35;
          const decay = Math.random() < decayProb ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 1.4);

          // Swaying wind drift
          const windDrift = Math.random() < 0.4 ? (wave > 0 ? 1 : -1) : 0;
          const randomDrift = Math.floor(Math.random() * 3) - 1;
          const drift = randomDrift + windDrift;

          const destX = Math.min(W - 1, Math.max(0, x + drift));
          const destY = y - 1;
          const destIdx = destY * W + destX;

          fireBuffer[destIdx] = heat >= decay ? heat - decay : 0;
        }
      }

      // 3. Create ImageData and map fireBuffer to colors
      const imgData = ctx.createImageData(W, H);
      const data = imgData.data;

      for (let i = 0; i < fireBuffer.length; i++) {
        const heat = fireBuffer[i];
        const color = VOLT_FIRE_PALETTE[heat] || VOLT_FIRE_PALETTE[0];
        const px = i * 4;
        data[px] = color[0];
        data[px + 1] = color[1];
        data[px + 2] = color[2];
        data[px + 3] = color[3];
      }

      // 4. Update and render sparks / flying embers inside fire buffer
      for (let s = sparks.length - 1; s >= 0; s--) {
        const spark = sparks[s];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life++;

        const ix = Math.round(spark.x);
        const iy = Math.round(spark.y);

        if (ix >= 0 && ix < W && iy >= 0 && iy < H && spark.life < spark.maxLife) {
          const p = (iy * W + ix) * 4;
          const lifeProgress = spark.life / spark.maxLife;

          // Intense mint white when fresh, cooling to volt green
          if (lifeProgress < 0.4) {
            data[p] = 240;
            data[p + 1] = 255;
            data[p + 2] = 245;
            data[p + 3] = 255;
          } else {
            data[p] = 34;
            data[p + 1] = 197;
            data[p + 2] = 94;
            data[p + 3] = Math.floor(255 * (1 - lifeProgress));
          }
        } else {
          sparks.splice(s, 1);
        }
      }

      // 5. Stamp the pixelated number directly into the frame buffer!
      // Heat shimmer floating motion:
      const shimmerY = Math.round(Math.sin(time * 0.004) * 0.8);
      const curStartY = numStartY + shimmerY;

      // Pass 1: Outline / Backplate for contrast against fire
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

              // Draw a 1-pixel dark border around each scaled pixel block
              for (let oy = -1; oy <= digitScale; oy++) {
                for (let ox = -1; ox <= digitScale; ox++) {
                  const px = baseX + ox;
                  const py = baseY + oy;
                  if (px >= 0 && px < W && py >= 0 && py < H) {
                    const idx = (py * W + px) * 4;
                    // Dark charcoal backplate with slight volt tint
                    data[idx] = 3;
                    data[idx + 1] = 16;
                    data[idx + 2] = 9;
                    data[idx + 3] = 245;
                  }
                }
              }
            }
          }
        }
      }

      // Pass 2: The glowing pixel digits themselves
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
                    // Bright phosphor white-mint center with electric volt tone
                    data[idx] = 240;
                    data[idx + 1] = 255;
                    data[idx + 2] = 244;
                    data[idx + 3] = 255;
                  }
                }
              }
            }
          }
        }
      }

      // Pass 3: Translucent foreground fire licks across the bottom edge
      // so the number feels embedded directly *inside* the burning inferno
      for (let x = numStartX - 2; x <= numStartX + totalNumWidth + 2; x++) {
        const lickY = curStartY + 7 * digitScale - 1;
        if (x >= 0 && x < W && lickY >= 0 && lickY < H) {
          const heatVal = fireBuffer[lickY * W + x];
          if (heatVal > 4 && Math.random() < 0.6) {
            const idx = (lickY * W + x) * 4;
            const c = VOLT_FIRE_PALETTE[heatVal];
            // Blend foreground fire pixel
            data[idx] = Math.min(255, data[idx] + c[0]);
            data[idx + 1] = Math.min(255, data[idx + 1] + c[1]);
            data[idx + 2] = Math.min(255, data[idx + 2] + c[2]);
            data[idx + 3] = 255;
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
      title={interactive ? "Click or tap to stoke the flames!" : undefined}
    >
      {/* Radiant ST-Finance Volt glow behind the flame */}
      <div
        className={`absolute w-36 h-36 rounded-full bg-emerald-500/25 blur-2xl pointer-events-none transition-all duration-300 ${
          isStoked ? "scale-125 bg-emerald-400/40" : "scale-100"
        }`}
      />

      {/* Chunky Pixel Canvas */}
      <canvas
        ref={canvasRef}
        className={`${dimensions.cssW} ${dimensions.cssH} [image-rendering:pixelated] [image-rendering:crisp-edges] transition-transform duration-200 active:scale-95`}
      />

      {/* Subtitle label in retro cyber font */}
      <div className="mt-[-8px] z-10 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.35)] flex items-center gap-1.5 backdrop-blur-xs">
        <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-xs" />
        {streak === 1 ? "DAY STREAK" : "DAYS BURNING"}
      </div>
    </div>
  );
}
