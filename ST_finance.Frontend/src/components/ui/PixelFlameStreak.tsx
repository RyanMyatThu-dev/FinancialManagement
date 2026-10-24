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

// Mysterio-style Arcane Green Palette:
// Spectral Smoke -> Toxic Jade -> Vivid Volt -> Ethereal Cyan-Mint -> Blinding White Core
const ARCANE_FIRE_PALETTE: [number, number, number, number][] = [
  [0, 0, 0, 0],         // 0: transparent
  [1, 20, 14, 180],     // 1: shadowy teal smoke
  [2, 42, 28, 215],     // 2: dark arcane jade
  [4, 70, 46, 240],     // 3: mystical deep green
  [6, 102, 64, 255],    // 4: spectral emerald
  [10, 140, 80, 255],   // 5: arcane emerald
  [18, 180, 96, 255],   // 6: toxic mist green
  [34, 215, 96, 255],   // 7: signature Mysterio volt green
  [58, 235, 115, 255],  // 8: electric sorcery lime
  [88, 248, 142, 255],  // 9: ethereal plasma mint
  [125, 252, 175, 255], // 10: radiant cyan-mint
  [170, 254, 208, 255], // 11: phosphor white-mint
  [215, 255, 235, 255], // 12: blinding arcane mint
  [242, 255, 250, 255], // 13: incandescent white-mint
  [255, 255, 255, 255], // 14: pure sorcery white core
];

interface ArcaneParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  dist: number;
  orbitSpeed: number;
  life: number;
  maxLife: number;
  isOrbiting: boolean;
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

  const dimensions = {
    sm: { w: 48, h: 76, cssW: "w-32", cssH: "h-48" },
    md: { w: 60, h: 96, cssW: "w-44", cssH: "h-68" },
    lg: { w: 70, h: 112, cssW: "w-56", cssH: "h-84" },
  }[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    stokeFuelRef.current = 32;
    setIsStoked(true);
    setTimeout(() => setIsStoked(false), 900);
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
    const particles: ArcaneParticle[] = [];
    const maxPaletteIdx = ARCANE_FIRE_PALETTE.length - 1;

    let animationFrameId: number;
    let lastTime = 0;
    let frameCount = 0;
    const targetFps = 34;
    const frameInterval = 1000 / targetFps;

    // Orb Center & Radius: positioned to cleanly engulf the number
    const orbCx = Math.floor(W / 2);
    const orbCy = Math.floor(H * 0.62);
    const baseOrbR = Math.floor(W * 0.28);

    const numStr = Math.max(0, streak).toString();

    let digitScale = 2;
    if (numStr.length >= 3) {
      digitScale = 1;
    } else if (numStr.length === 1 && W >= 56) {
      digitScale = 2;
    }

    const digitWidth = 5 * digitScale;
    const digitSpacing = 1 * digitScale;
    const totalNumWidth = numStr.length * digitWidth + (numStr.length - 1) * digitSpacing;
    const totalNumHeight = 7 * digitScale;

    // Number sits precisely in the center of the orb
    const numStartX = Math.floor(orbCx - totalNumWidth / 2);
    const numStartY = Math.floor(orbCy - totalNumHeight / 2);

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

      // Ignition Progression:
      // Frame 0..24: Arcane Orb forms and engulfs the center
      // Frame 25..50: Orb ignites upwards into tall Mysterio flames
      // Frame 50+: Continuous roaring arcane burning with persistent glowing orb
      let orbIntensity = 1.0;
      let upwardIgnition = 1.0;

      if (frameCount < 24) {
        orbIntensity = Math.min(1.0, frameCount / 22);
        upwardIgnition = 0.05 + 0.1 * (frameCount / 24);
      } else if (frameCount < 52) {
        orbIntensity = 1.0;
        const p = (frameCount - 24) / 28;
        upwardIgnition = 0.15 + 0.85 * Math.sin(p * Math.PI * 0.5);
      } else {
        orbIntensity = 1.0;
        upwardIgnition = 1.0;
      }

      if (isBoosted) {
        orbIntensity = 1.2;
        upwardIgnition = Math.max(upwardIgnition, 1.25);
      }

      // 1. Seed Arcane Circular Orb (engulfing the number)
      const t = time * 0.003;
      const orbWobble = Math.sin(t * 2.5) * 1.5;

      for (let y = Math.max(0, orbCy - baseOrbR - 5); y <= Math.min(H - 1, orbCy + baseOrbR + 5); y++) {
        for (let x = Math.max(0, orbCx - baseOrbR - 5); x <= Math.min(W - 1, orbCx + baseOrbR + 5); x++) {
          const dx = x - orbCx;
          const dy = y - orbCy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Arcane swirling boundary ripples
          const boundaryMod =
            Math.sin(angle * 3 + t * 4) * 1.6 +
            Math.cos(angle * 5 - t * 3) * 1.0 +
            orbWobble;
          const currentR = baseOrbR + boundaryMod;

          if (dist <= currentR + 1.8) {
            // Hot perimeter ring + churning interior plasma
            const rimDist = Math.abs(dist - currentR);
            const rimFactor = Math.exp(-Math.pow(rimDist / 2.0, 2));
            const coreFactor = (1 - (dist / currentR) * 0.4) * (0.65 + 0.35 * Math.sin(t * 3 + angle * 2));
            const noise = (Math.sin(t * 4 + x * 0.4 + y * 0.3) + 1) * 0.5;

            const baseHeat = Math.min(
              maxPaletteIdx,
              Math.floor(
                (maxPaletteIdx * (rimFactor * 1.05 + coreFactor * 0.75) + noise * 2) *
                  orbIntensity
              )
            );

            const idx = y * W + x;
            fireBuffer[idx] = Math.max(fireBuffer[idx], baseHeat);

            // Spawn orbiting mystical sparks on the orb perimeter
            if (rimDist < 1.4 && Math.random() < (isBoosted ? 0.3 : 0.07)) {
              particles.push({
                x,
                y,
                vx: 0,
                vy: 0,
                angle,
                dist: currentR,
                orbitSpeed: 0.12 * (Math.random() > 0.5 ? 1 : -1),
                life: 0,
                maxLife: 28 + Math.random() * 24,
                isOrbiting: true,
              });
            }
          }
        }
      }

      // Ensure the space below the orb is clean (not a bottom stove/campfire)
      for (let y = orbCy + baseOrbR + 4; y < H; y++) {
        for (let x = 0; x < W; x++) {
          fireBuffer[y * W + x] = 0;
        }
      }

      // 2. Arcane Upward Convection (ignites upwards from the orb into the sky)
      for (let y = 1; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const srcIdx = y * W + x;
          const heat = fireBuffer[srcIdx];
          if (heat === 0) continue;

          const dx = x - orbCx;
          const dy = y - orbCy;
          const distFromCenter = Math.abs(dx) / (W / 2);

          // Convection speed depends on upwardIgnition stage
          let stepY = 1;
          if (y <= orbCy && Math.random() < 0.4 * upwardIgnition) {
            stepY = 2;
          }

          // Arcane swirling drift around the orb + mystical wind whipping upwards
          let swirlDrift = 0;
          if (y >= orbCy - baseOrbR && y <= orbCy + baseOrbR) {
            swirlDrift = Math.round(-Math.sign(dy) * Math.sin(t * 3) * 1.2);
          }

          const windWhip = Math.sin(t * 2.2 + y * 0.07) * 0.9;
          const randomDrift = Math.floor(Math.random() * 3) - 1;
          const drift = Math.round(randomDrift + windWhip + swirlDrift * 0.5);

          const destX = Math.min(W - 1, Math.max(0, x + drift));
          const destY = Math.max(0, y - stepY);

          // Decay rate: low decay in rising plume above orb once ignited
          let decayProb = 0.4;
          if (y <= orbCy) {
            // Plume rising above orb
            decayProb = distFromCenter < 0.28 ? 0.16 / upwardIgnition : 0.38;
          } else {
            // Bottom of orb decays quickly to keep the circle defined
            decayProb = 0.55;
          }

          const decay = Math.random() < decayProb ? 1 : 0;
          const destIdx = destY * W + destX;

          fireBuffer[destIdx] = heat >= decay ? heat - decay : 0;
        }
      }

      // 3. Render fireBuffer to ImageData
      const imgData = ctx.createImageData(W, H);
      const data = imgData.data;

      for (let i = 0; i < fireBuffer.length; i++) {
        const heat = fireBuffer[i];
        const color = ARCANE_FIRE_PALETTE[heat] || ARCANE_FIRE_PALETTE[0];
        const px = i * 4;
        data[px] = color[0];
        data[px + 1] = color[1];
        data[px + 2] = color[2];
        data[px + 3] = color[3];
      }

      // 4. Update & Render Mystical Orbiting Sparks & Rising Embers
      for (let s = particles.length - 1; s >= 0; s--) {
        const p = particles[s];
        p.life++;

        if (p.isOrbiting) {
          p.angle += p.orbitSpeed;
          p.x = orbCx + Math.cos(p.angle) * p.dist;
          p.y = orbCy + Math.sin(p.angle) * p.dist;

          // Detach and ignite upward into smoke
          if (p.life > 10 && Math.sin(p.angle) < 0 && upwardIgnition > 0.3) {
            p.isOrbiting = false;
            p.vx = (Math.random() - 0.5) * 0.8 + Math.cos(p.angle) * 0.5;
            p.vy = -(1.5 + Math.random() * 2.0 * upwardIgnition);
          }
        } else {
          p.x += p.vx;
          p.y += p.vy;
        }

        const ix = Math.round(p.x);
        const iy = Math.round(p.y);

        if (ix >= 0 && ix < W && iy >= 0 && iy < H && p.life < p.maxLife) {
          const idx = (iy * W + ix) * 4;
          const lifeProgress = p.life / p.maxLife;

          if (lifeProgress < 0.3) {
            data[idx] = 250;
            data[idx + 1] = 255;
            data[idx + 2] = 252;
            data[idx + 3] = 255;
          } else if (lifeProgress < 0.65) {
            data[idx] = 88;
            data[idx + 1] = 248;
            data[idx + 2] = 142;
            data[idx + 3] = 240;
          } else {
            data[idx] = 34;
            data[idx + 1] = 215;
            data[idx + 2] = 96;
            data[idx + 3] = Math.floor(255 * (1 - lifeProgress));
          }
        } else {
          particles.splice(s, 1);
        }
      }

      // 5. Stamp the Pixelated Number into the Core of the Orb
      const shimmerY = Math.round(Math.sin(time * 0.005) * 0.8);
      const curStartY = numStartY + shimmerY;

      // Pass 1: Dark Obsidian Backplate for crisp pixel readability
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
                    // Obsidian-jade shadow border
                    data[idx] = 2;
                    data[idx + 1] = 14;
                    data[idx + 2] = 9;
                    data[idx + 3] = 245;
                  }
                }
              }
            }
          }
        }
      }

      // Pass 2: Phosphor White-Mint Pixel Glyph Fill
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
                    data[idx] = 242;
                    data[idx + 1] = 255;
                    data[idx + 2] = 248;
                    data[idx + 3] = 255;
                  }
                }
              }
            }
          }
        }
      }

      // Pass 3: Translucent Arcane Wisps curling across the number
      // so it sits truly submerged inside the center of the mystical orb
      for (let x = numStartX - 1; x <= numStartX + totalNumWidth + 1; x++) {
        for (let y = curStartY - 1; y <= curStartY + totalNumHeight + 1; y++) {
          if (x >= 0 && x < W && y >= 0 && y < H) {
            const heatVal = fireBuffer[y * W + x];
            if (heatVal > 5 && Math.random() < 0.4) {
              const idx = (y * W + x) * 4;
              const c = ARCANE_FIRE_PALETTE[heatVal];
              data[idx] = Math.min(255, data[idx] + c[0] * 0.6);
              data[idx + 1] = Math.min(255, data[idx + 1] + c[1] * 0.6);
              data[idx + 2] = Math.min(255, data[idx + 2] + c[2] * 0.6);
              data[idx + 3] = 255;
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
      title={interactive ? "Click or tap to unleash arcane surge!" : undefined}
    >
      {/* Mysterio-style Arcane Green Radial Glow & Smoke Aura */}
      <div
        className={`absolute w-44 h-56 rounded-full bg-[radial-gradient(circle_at_50%_62%,rgba(34,215,96,0.32)_0%,rgba(16,185,129,0.15)_45%,transparent_75%)] blur-2xl pointer-events-none transition-all duration-300 ${
          isStoked ? "scale-125 opacity-100" : "scale-100 opacity-90"
        }`}
      />

      {/* Chunky Pixel Canvas */}
      <canvas
        ref={canvasRef}
        className={`${dimensions.cssW} ${dimensions.cssH} [image-rendering:pixelated] [image-rendering:crisp-edges] transition-transform duration-200 active:scale-95`}
      />

      {/* Subtitle label in retro cyber font */}
      <div className="mt-[-4px] z-10 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.35)] flex items-center gap-1.5 backdrop-blur-xs">
        <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-xs" />
        {streak === 1 ? "ARCANE STREAK" : "DAYS ENGULFED"}
      </div>
    </div>
  );
}
