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

// Rich 8-shade ST-Finance Volt Green Fire Palette:
// Transparent -> Dark Pine Edge -> Forest Emerald -> Vivid Emerald -> Signature Volt -> Electric Lime -> Cyber Mint -> Incandescent Core
const VOLT_FIRE_PALETTE: [number, number, number, number][] = [
  [0, 0, 0, 0],         // 0: transparent
  [2, 32, 18, 220],     // 1: dark pine edge
  [4, 68, 38, 255],     // 2: forest emerald
  [8, 128, 68, 255],    // 3: vivid emerald
  [34, 197, 94, 255],   // 4: signature ST-Finance volt
  [74, 222, 128, 255],  // 5: electric lime-volt
  [134, 239, 172, 255], // 6: cyber mint
  [240, 255, 246, 255], // 7: incandescent white-mint
];

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  heat: number;
  size: number;
  type: "orb" | "spin" | "spire" | "left_tongue" | "right_tongue" | "core" | "spark";
  angle?: number;
  radius?: number;
  omega?: number;
}

export function PixelFlameStreak({
  streak,
  size = "md",
  interactive = true,
  className = "",
}: PixelFlameStreakProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isStoked, setIsStoked] = useState(false);
  const stokeRef = useRef<number>(0);

  const dimensions = {
    sm: { w: 42, h: 60, cssW: "w-28", cssH: "h-40" },
    md: { w: 52, h: 72, cssW: "w-36", cssH: "h-50" },
    lg: { w: 60, h: 84, cssW: "w-44", cssH: "h-62" },
  }[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    stokeRef.current = 28;
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

    let animationFrameId: number;
    let lastTime = 0;
    let frameCount = 0;
    const targetFps = 34;
    const frameInterval = 1000 / targetFps;

    // Anchor points for the flame model & starting orb
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H * 0.62);
    const orbRadius = Math.floor(W * 0.26);

    const particles: FireParticle[] = [];

    // Pre-populate initial orb particles
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const r = orbRadius + (Math.random() - 0.5) * 2;
      particles.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 25 + Math.random() * 20,
        heat: 4 + Math.floor(Math.random() * 3),
        size: Math.random() < 0.6 ? 2 : 1,
        type: "orb",
        angle,
        radius: r,
        omega: 0.05 + Math.random() * 0.04,
      });
    }

    const numStr = Math.max(0, streak).toString();
    let digitScale = 2;
    if (numStr.length >= 3) {
      digitScale = 1;
    } else if (numStr.length === 1 && W >= 50) {
      digitScale = 2;
    }

    const digitWidth = 5 * digitScale;
    const digitSpacing = 1 * digitScale;
    const totalNumWidth = numStr.length * digitWidth + (numStr.length - 1) * digitSpacing;
    const totalNumHeight = 7 * digitScale;

    // Number is anchored inside the core of the orb / flame belly
    const numStartX = Math.floor(cx - totalNumWidth / 2);
    const numStartY = Math.floor(cy - totalNumHeight / 2);

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = time - lastTime;
      if (delta < frameInterval) return;
      lastTime = time - (delta % frameInterval);

      frameCount++;

      const isBoosted = stokeRef.current > 0;
      if (isBoosted) stokeRef.current--;

      // Animation Stages:
      // Stage 1 (frame 0..20): Particle Orb
      // Stage 2 (frame 21..48): Flame spins around the orb (vortex)
      // Stage 3 (frame 49+): Detailed multi-tongue flame model with active particles
      const isOrbStage = frameCount < 20;
      const isSpinStage = frameCount >= 20 && frameCount < 48;
      const isFlameModel = frameCount >= 48;

      const t = time * 0.003;

      // ── PARTICLE SPAWNERS ──────────────────────────────────────────

      // 1. Orb Spawner (Stage 1 & Stage 2)
      if (isOrbStage || isSpinStage) {
        const spawnCount = isSpinStage ? 5 : 2;
        const spinSpeed = isSpinStage ? 0.22 : 0.06;

        for (let i = 0; i < spawnCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = orbRadius + (Math.random() - 0.5) * 3;
          particles.push({
            x: cx + Math.cos(angle) * r,
            y: cy + Math.sin(angle) * r,
            vx: isSpinStage ? -Math.sin(angle) * 1.8 : 0,
            vy: isSpinStage ? Math.cos(angle) * 1.8 : 0,
            life: 0,
            maxLife: isSpinStage ? 18 + Math.random() * 15 : 24 + Math.random() * 20,
            heat: isSpinStage ? 5 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 3),
            size: Math.random() < 0.6 ? 2 : 1,
            type: isSpinStage ? "spin" : "orb",
            angle,
            radius: r,
            omega: spinSpeed * (Math.random() > 0.1 ? 1 : -1),
          });
        }
      }

      // 2. Detailed Multi-Tongue Flame Model Spawners (Stage 3 & Continuous)
      if (isFlameModel) {
        // A. Central Main Spire (tallest column, hot core)
        const spireCount = isBoosted ? 5 : 3;
        for (let i = 0; i < spireCount; i++) {
          const sx = cx + (Math.random() - 0.5) * 8;
          const sy = cy + 4 + Math.random() * 4;
          const sway = Math.sin(t * 4 + sy * 0.1) * 0.6;
          particles.push({
            x: sx,
            y: sy,
            vx: (Math.random() - 0.5) * 0.8 + sway,
            vy: -(1.6 + Math.random() * 1.8 + (isBoosted ? 0.8 : 0)),
            life: 0,
            maxLife: 26 + Math.random() * 16,
            heat: 7,
            size: Math.random() < 0.7 ? 2 : 1,
            type: "spire",
          });
        }

        // B. Left Tongue (articulated side tongue curling left-upward)
        const leftCount = isBoosted ? 3 : 2;
        for (let i = 0; i < leftCount; i++) {
          const lx = cx - 6 + (Math.random() - 0.5) * 6;
          const ly = cy + 2 + Math.random() * 4;
          particles.push({
            x: lx,
            y: ly,
            vx: -(0.5 + Math.random() * 0.9), // curls outward to the left
            vy: -(1.2 + Math.random() * 1.4),
            life: 0,
            maxLife: 20 + Math.random() * 12,
            heat: 6,
            size: Math.random() < 0.5 ? 2 : 1,
            type: "left_tongue",
          });
        }

        // C. Right Tongue (articulated side tongue curling right-upward)
        const rightCount = isBoosted ? 3 : 2;
        for (let i = 0; i < rightCount; i++) {
          const rx = cx + 6 + (Math.random() - 0.5) * 6;
          const ry = cy + 2 + Math.random() * 4;
          particles.push({
            x: rx,
            y: ry,
            vx: 0.5 + Math.random() * 0.9, // curls outward to the right
            vy: -(1.2 + Math.random() * 1.4),
            life: 0,
            maxLife: 20 + Math.random() * 12,
            heat: 6,
            size: Math.random() < 0.5 ? 2 : 1,
            type: "right_tongue",
          });
        }

        // D. Belly Base Cluster (hot burning bed around the number)
        for (let i = 0; i < 2; i++) {
          const bx = cx + (Math.random() - 0.5) * (orbRadius * 1.5);
          const by = cy + (Math.random() - 0.5) * 8;
          particles.push({
            x: bx,
            y: by,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -(0.4 + Math.random() * 0.7),
            life: 0,
            maxLife: 15 + Math.random() * 10,
            heat: 5 + Math.floor(Math.random() * 3),
            size: 2,
            type: "core",
          });
        }

        // E. Detached Sparks breaking off the spires
        if (Math.random() < (isBoosted ? 0.6 : 0.25)) {
          const sparkSourceX = cx + (Math.random() - 0.5) * 12;
          particles.push({
            x: sparkSourceX,
            y: cy - 14,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(1.8 + Math.random() * 1.5),
            life: 0,
            maxLife: 18 + Math.random() * 14,
            heat: 6,
            size: 1,
            type: "spark",
          });
        }
      }

      // ── PARTICLE UPDATE & RENDER TO BUFFER ──────────────────────────

      const buffer = new Uint8Array(W * H);

      for (let pIdx = particles.length - 1; pIdx >= 0; pIdx--) {
        const p = particles[pIdx];
        p.life++;

        if (p.life >= p.maxLife) {
          particles.splice(pIdx, 1);
          continue;
        }

        // Movement physics by particle type
        if (p.type === "orb") {
          if (p.angle !== undefined && p.radius !== undefined && p.omega !== undefined) {
            p.angle += p.omega;
            p.x = cx + Math.cos(p.angle) * p.radius;
            p.y = cy + Math.sin(p.angle) * p.radius;
          }
        } else if (p.type === "spin") {
          if (p.angle !== undefined && p.radius !== undefined && p.omega !== undefined) {
            p.angle += p.omega;
            // Radius tightens slightly while spinning
            p.radius = Math.max(orbRadius * 0.8, p.radius - 0.05);
            p.x = cx + Math.cos(p.angle) * p.radius;
            p.y = cy + Math.sin(p.angle) * p.radius;

            // Transition: upward lift starts occurring toward the end of spin
            if (frameCount > 40 && Math.sin(p.angle) < 0) {
              p.type = "spire";
              p.vy = -(1.8 + Math.random() * 1.2);
              p.vx = (Math.random() - 0.5) * 1.0;
            }
          }
        } else {
          // Flame Model upward movement with natural aerodynamic pull
          if (p.type === "left_tongue" && p.life > 6) {
            // Left tongue curves back slightly toward the tip
            p.vx += 0.04;
          } else if (p.type === "right_tongue" && p.life > 6) {
            // Right tongue curves back slightly toward the tip
            p.vx -= 0.04;
          }

          p.x += p.vx;
          p.y += p.vy;
        }

        // Heat cooling progression
        const lifeFraction = p.life / p.maxLife;
        if (p.type === "spark") {
          p.heat = lifeFraction < 0.4 ? 6 : lifeFraction < 0.7 ? 4 : 2;
        } else {
          if (lifeFraction < 0.25) p.heat = Math.min(7, p.heat);
          else if (lifeFraction < 0.55) p.heat = Math.max(4, p.heat - 1);
          else if (lifeFraction < 0.8) p.heat = Math.max(2, p.heat - 2);
          else p.heat = 1;
        }

        // Stamp onto pixel grid
        const ix = Math.round(p.x);
        const iy = Math.round(p.y);

        for (let sy = 0; sy < p.size; sy++) {
          for (let sx = 0; sx < p.size; sx++) {
            const rx = ix + sx;
            const ry = iy + sy;
            if (rx >= 0 && rx < W && ry >= 0 && ry < H) {
              const bIdx = ry * W + rx;
              buffer[bIdx] = Math.max(buffer[bIdx], p.heat);
            }
          }
        }
      }

      // ── CONVERT BUFFER TO IMAGEDATA ────────────────────────────────

      const imgData = ctx.createImageData(W, H);
      const data = imgData.data;

      for (let i = 0; i < buffer.length; i++) {
        const heat = buffer[i];
        if (heat > 0) {
          const c = VOLT_FIRE_PALETTE[heat];
          const px = i * 4;
          data[px] = c[0];
          data[px + 1] = c[1];
          data[px + 2] = c[2];
          data[px + 3] = c[3];
        }
      }

      // ── STAMP PIXELATED NUMBER IN CORE ──────────────────────────────

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

      // Pass 2: Bright Incandescent White-Mint Glyph Fill
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
                    data[idx + 1] = 255;
                    data[idx + 2] = 246;
                    data[idx + 3] = 255;
                  }
                }
              }
            }
          }
        }
      }

      // Pass 3: Translucent foreground fire particles licking across the number
      for (let x = numStartX - 1; x <= numStartX + totalNumWidth + 1; x++) {
        for (let y = curStartY; y <= curStartY + totalNumHeight; y++) {
          if (x >= 0 && x < W && y >= 0 && y < H) {
            const h = buffer[y * W + x];
            if (h >= 4 && Math.random() < 0.3) {
              const idx = (y * W + x) * 4;
              const c = VOLT_FIRE_PALETTE[h];
              data[idx] = Math.min(255, data[idx] + c[0] * 0.4);
              data[idx + 1] = Math.min(255, data[idx + 1] + c[1] * 0.4);
              data[idx + 2] = Math.min(255, data[idx + 2] + c[2] * 0.4);
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
      title={interactive ? "Click or tap to stoke!" : undefined}
    >
      {/* Subtle Neon Volt Aura behind the Flame */}
      <div
        className={`absolute w-36 h-48 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none transition-all duration-300 ${
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
