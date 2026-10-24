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

// ST-Finance Signature Neon Volt Fire Palette:
// Transparent -> Deep Pine Rim -> Forest Emerald -> Vivid Emerald -> Signature Volt -> Bright Lime -> Cyber Mint -> Incandescent Core
const FLAME_PALETTE: [number, number, number, number][] = [
  [0, 0, 0, 0],         // 0: transparent
  [2, 34, 18, 220],     // 1: deep pine rim
  [4, 68, 36, 255],     // 2: forest emerald
  [8, 128, 68, 255],    // 3: vivid emerald
  [34, 197, 94, 255],   // 4: signature ST-Finance volt
  [74, 222, 128, 255],  // 5: electric lime-volt
  [134, 239, 172, 255], // 6: cyber mint
  [240, 255, 246, 255], // 7: incandescent white-mint
];

interface SphereParticle {
  origX: number;
  origY: number;
  origZ: number;
  projX: number;
  projY: number;
  depth: number;
  heat: number;
  size: number;
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
    sm: { w: 44, h: 62, cssW: "w-28", cssH: "h-40" },
    md: { w: 54, h: 74, cssW: "w-36", cssH: "h-50" },
    lg: { w: 62, h: 86, cssW: "w-44", cssH: "h-62" },
  }[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    stokeRef.current = 26;
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
    let currentSpinAngle = 0;
    const targetFps = 34;
    const frameInterval = 1000 / targetFps;

    // Anchor points for 3D sphere and burning flame
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H * 0.62);
    const sphereRadius = Math.floor(W * 0.26);

    // Pre-calculate 3D Fibonacci sphere points (uniform 3D distribution)
    const NUM_SPHERE_POINTS = 64;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const goldenAngle = 2 * Math.PI * (1 - 1 / goldenRatio);

    const sphereParticles: SphereParticle[] = [];
    for (let i = 0; i < NUM_SPHERE_POINTS; i++) {
      const y = 1 - (i / (NUM_SPHERE_POINTS - 1)) * 2; // -1 to 1
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      sphereParticles.push({
        origX: x * sphereRadius,
        origY: y * sphereRadius,
        origZ: z * sphereRadius,
        projX: 0,
        projY: 0,
        depth: 0,
        heat: 4 + Math.floor(Math.random() * 3),
        size: 1,
      });
    }

    // Cellular fire grid for authentic burning flames
    const fireBuffer = new Uint8Array(W * H);

    const numStr = Math.max(0, streak).toString();
    let digitScale = 2;
    if (numStr.length >= 3) {
      digitScale = 1;
    } else if (numStr.length === 1 && W >= 52) {
      digitScale = 2;
    }

    const digitWidth = 5 * digitScale;
    const digitSpacing = 1 * digitScale;
    const totalNumWidth = numStr.length * digitWidth + (numStr.length - 1) * digitSpacing;
    const totalNumHeight = 7 * digitScale;

    // Number sits in the belly of the flame / center of the 3D sphere
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

      // ── LIFECYCLE PROGRESSION ──────────────────────────────────────
      // 0..22: 3D Particle Sphere rotating around number
      // 23..48: 3D Flame Vortex Spin (accelerating spin around the sphere in 3D)
      // 49..70: Ignites upward into true burning flame model
      // 70+: Continuous authentic burning flames with living multi-tongue physics
      let spinSpeed = 0.05;
      let flameMorph = 0.0;

      if (frameCount < 22) {
        spinSpeed = 0.05;
        flameMorph = 0.0;
      } else if (frameCount < 48) {
        const p = (frameCount - 22) / 26;
        spinSpeed = 0.05 + p * 0.28; // Accelerate spin in 3D!
        flameMorph = Math.max(0, (p - 0.6) / 0.4);
      } else if (frameCount < 70) {
        const p = (frameCount - 48) / 22;
        spinSpeed = 0.33 * (1 - p);
        flameMorph = 0.4 + 0.6 * Math.sin(p * Math.PI * 0.5);
      } else {
        spinSpeed = isBoosted ? 0.12 : 0.0;
        flameMorph = 1.0;
      }

      currentSpinAngle += spinSpeed;
      const t = time * 0.003;

      // ── 1. 3D SPHERE ROTATION & PERSPECTIVE PROJECTION ──────────────
      const tiltAngle = 0.32; // Slight 3D tilt for depth visibility
      const cosTilt = Math.cos(tiltAngle);
      const sinTilt = Math.sin(tiltAngle);
      const cosSpin = Math.cos(currentSpinAngle);
      const sinSpin = Math.sin(currentSpinAngle);

      for (let i = 0; i < sphereParticles.length; i++) {
        const p = sphereParticles[i];
        // Rotate around Y
        const x1 = p.origX * cosSpin + p.origZ * sinSpin;
        const z1 = -p.origX * sinSpin + p.origZ * cosSpin;

        // Tilt around X
        const y2 = p.origY * cosTilt - z1 * sinTilt;
        const z2 = p.origY * sinTilt + z1 * cosTilt;

        p.projX = cx + x1;
        p.projY = cy + y2;
        p.depth = z2; // from -sphereRadius (back) to +sphereRadius (front)

        // Depth shading: front particles are white-hot and larger; back are darker emerald
        const depthNorm = (z2 + sphereRadius) / (sphereRadius * 2); // 0 (back) to 1 (front)
        p.heat = Math.max(1, Math.min(7, Math.floor(2 + depthNorm * 5)));
        p.size = depthNorm > 0.55 ? 2 : 1;
      }

      // ── 2. AUTHENTIC BURNING FLAME CELLULAR SIMULATION ─────────────
      // Flame geometry: wide burning base with articulated Center, Left, and Right licking tongues
      const flameBaseY = Math.floor(H * 0.88);
      const mainTipY = Math.floor(H * 0.10);
      const leftTipY = Math.floor(H * 0.28);
      const rightTipY = Math.floor(H * 0.24);

      // Sways and flickers for each tongue
      const centerSway = Math.sin(t * 4.0) * 3.0 + Math.sin(t * 7.5) * 1.5;
      const leftSway = Math.cos(t * 4.5) * 2.0;
      const rightSway = -Math.sin(t * 5.0) * 2.2;

      // Seed the burning furnace well at the base of the flame
      for (let x = 0; x < W; x++) {
        const distFromCenter = Math.abs(x - cx) / (W * 0.38);
        if (distFromCenter < 1.0) {
          const envelope = Math.cos(distFromCenter * (Math.PI / 2));
          const noise = (Math.sin(t * 8 + x * 0.5) + 1) * 0.5;
          const heatBoost = isBoosted ? 2 : 0;
          const baseHeat = Math.min(7, Math.floor((6 + heatBoost) * envelope * (0.8 + 0.2 * noise)));

          for (let r = 0; r < 3; r++) {
            fireBuffer[(flameBaseY - r) * W + x] = Math.random() < 0.92 ? Math.max(0, baseHeat - r) : 0;
          }
        } else {
          for (let r = 0; r < 3; r++) fireBuffer[(flameBaseY - r) * W + x] = 0;
        }
      }

      // Convection step bounded by authentic multi-tongue flame contours
      for (let y = 1; y < flameBaseY; y++) {
        const normY = (y - mainTipY) / (flameBaseY - mainTipY); // 0 at tip, 1 at base

        for (let x = 0; x < W; x++) {
          const srcIdx = y * W + x;
          const heat = fireBuffer[srcIdx];
          if (heat === 0) continue;

          // Multi-tongue flame mask: check distance to nearest tongue axis
          const centerAxis = cx + centerSway * (1 - normY);
          const leftAxis = cx - 8 + leftSway;
          const rightAxis = cx + 8 + rightSway;

          const distCenter = Math.abs(x - centerAxis);
          const distLeft = Math.abs(x - leftAxis);
          const distRight = Math.abs(x - rightAxis);

          // Tongue widths
          const centerW = Math.max(1, 14 * Math.sin(normY * Math.PI * 0.85));
          const leftW = y > leftTipY ? Math.max(1, 6 * Math.sin(((y - leftTipY) / (flameBaseY - leftTipY)) * Math.PI)) : 0;
          const rightW = y > rightTipY ? Math.max(1, 6 * Math.sin(((y - rightTipY) / (flameBaseY - rightTipY)) * Math.PI)) : 0;

          const inFlame = distCenter <= centerW || distLeft <= leftW || distRight <= rightW;

          if (!inFlame) {
            fireBuffer[srcIdx] = Math.max(0, heat - 2);
            continue;
          }

          // Natural flame upward draft
          const stepY = (normY < 0.6 && Math.random() < 0.35) ? 2 : 1;
          const wind = Math.sin(t * 3.0 + y * 0.08) * 0.8;
          const drift = Math.round((Math.random() - 0.5) * 1.6 + wind);

          const destX = Math.min(W - 1, Math.max(0, x + drift));
          const destY = Math.max(0, y - stepY);

          // Natural fire decay: lower in hot center, higher near edges/tips
          const decayProb = (distCenter < 3 && normY > 0.4) ? 0.15 : 0.38;
          const decay = Math.random() < decayProb ? 1 : 0;

          fireBuffer[destY * W + destX] = heat >= decay ? heat - decay : 0;
        }
      }

      // ── 3. COMPOSITE RENDER TO CANVAS ──────────────────────────────
      const imgData = ctx.createImageData(W, H);
      const data = imgData.data;

      const setPixel = (px: number, py: number, heat: number) => {
        if (px >= 0 && px < W && py >= 0 && py < H && heat > 0) {
          const idx = (py * W + px) * 4;
          const c = FLAME_PALETTE[heat];
          data[idx] = c[0];
          data[idx + 1] = c[1];
          data[idx + 2] = c[2];
          data[idx + 3] = c[3];
        }
      };

      // Layer A: Flame simulation (morph weighted)
      if (flameMorph > 0.0) {
        for (let i = 0; i < fireBuffer.length; i++) {
          const heat = fireBuffer[i];
          if (heat > 0) {
            const px = i % W;
            const py = Math.floor(i / W);
            const blendedHeat = Math.min(7, Math.floor(heat * flameMorph));
            if (blendedHeat > 0) {
              setPixel(px, py, blendedHeat);
            }
          }
        }
      }

      // Layer B: Back 3D Sphere Particles (rendered behind the number)
      if (flameMorph < 1.0) {
        const sphereAlpha = 1.0 - flameMorph * 0.85;
        for (let i = 0; i < sphereParticles.length; i++) {
          const p = sphereParticles[i];
          if (p.depth < 0) {
            const ix = Math.round(p.projX);
            const iy = Math.round(p.projY);
            const h = Math.max(1, Math.floor(p.heat * sphereAlpha));
            setPixel(ix, iy, h);
          }
        }
      }

      // Layer C: Pixelated Streak Number
      const shimmerY = Math.round(Math.sin(time * 0.005) * 0.8);
      const curStartY = numStartY + shimmerY;

      // Pass 1: Obsidian shadow backing for maximum contrast
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

      // Layer D: Front 3D Sphere Particles (rendered in front of the number)
      if (flameMorph < 1.0) {
        const sphereAlpha = 1.0 - flameMorph * 0.85;
        for (let i = 0; i < sphereParticles.length; i++) {
          const p = sphereParticles[i];
          if (p.depth >= 0) {
            const ix = Math.round(p.projX);
            const iy = Math.round(p.projY);
            const h = Math.max(1, Math.floor(p.heat * sphereAlpha));
            for (let sy = 0; sy < p.size; sy++) {
              for (let sx = 0; sx < p.size; sx++) {
                setPixel(ix + sx, iy + sy, h);
              }
            }
          }
        }
      }

      // Layer E: Translucent flame wisps curling across the number
      if (flameMorph > 0.3) {
        for (let x = numStartX - 1; x <= numStartX + totalNumWidth + 1; x++) {
          for (let y = curStartY; y <= curStartY + totalNumHeight; y++) {
            if (x >= 0 && x < W && y >= 0 && y < H) {
              const h = fireBuffer[y * W + x];
              if (h >= 4 && Math.random() < 0.28) {
                const idx = (y * W + x) * 4;
                const c = FLAME_PALETTE[h];
                data[idx] = Math.min(255, data[idx] + c[0] * 0.35);
                data[idx + 1] = Math.min(255, data[idx + 1] + c[1] * 0.35);
                data[idx + 2] = Math.min(255, data[idx + 2] + c[2] * 0.35);
                data[idx + 3] = 255;
              }
            }
          }
        }
      }

      // Layer F: Floating Pixel Embers detaching from the flame spires
      if (flameMorph > 0.5) {
        const emberX = Math.round(cx + centerSway * 0.9);
        const emberY = mainTipY - Math.floor((frameCount % 14) * 0.8);
        if (emberY >= 0 && emberY < mainTipY && emberX >= 0 && emberX < W) {
          setPixel(emberX, emberY, 5);
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
