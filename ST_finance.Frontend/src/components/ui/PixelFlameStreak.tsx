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

// High-Contrast 8-Grade Volt Flame Palette:
// Transparent -> Deep Pine Outline -> Forest Emerald -> Vivid Emerald -> Signature Volt -> Bright Lime -> Cyber Mint -> Incandescent Core
const FLAME_PALETTE: [number, number, number, number][] = [
  [0, 0, 0, 0],         // 0: transparent
  [2, 34, 18, 240],     // 1: deep pine contour
  [4, 70, 38, 255],     // 2: forest emerald
  [8, 130, 68, 255],    // 3: vivid emerald
  [34, 197, 94, 255],   // 4: signature ST-Finance volt
  [74, 222, 128, 255],  // 5: electric lime-volt
  [140, 245, 180, 255], // 6: cyber mint
  [245, 255, 250, 255], // 7: incandescent white-mint
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
    sm: { w: 46, h: 64, cssW: "w-28", cssH: "h-40" },
    md: { w: 56, h: 78, cssW: "w-36", cssH: "h-50" },
    lg: { w: 66, h: 90, cssW: "w-44", cssH: "h-62" },
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

    // Anchor points
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H * 0.65);
    const sphereRadius = Math.floor(W * 0.28);

    // ── HIGH-INTENSITY 3D SPHERE GENERATOR (140 surface + 32 orbital points) ──
    const NUM_SPHERE_POINTS = 140;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const sphereParticles: SphereParticle[] = [];

    // Surface volumetric points
    for (let i = 0; i < NUM_SPHERE_POINTS; i++) {
      const y = 1 - (i / (NUM_SPHERE_POINTS - 1)) * 2;
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

    // High-speed equatorial energy orbit rings for extra 3D intensity
    const NUM_ORBIT_POINTS = 32;
    for (let i = 0; i < NUM_ORBIT_POINTS; i++) {
      const theta = (i / NUM_ORBIT_POINTS) * Math.PI * 2;
      const r = sphereRadius * (0.95 + Math.random() * 0.15);
      sphereParticles.push({
        origX: Math.cos(theta) * r,
        origY: (Math.random() - 0.5) * 3, // slightly flared equator
        origZ: Math.sin(theta) * r,
        projX: 0,
        projY: 0,
        depth: 0,
        heat: 6 + Math.floor(Math.random() * 2), // white-hot / cyan mint
        size: 2,
      });
    }

    // Cellular fire grid for authentic burning flames
    const fireBuffer = new Uint8Array(W * H);

    const numStr = Math.max(0, streak).toString();
    let digitScale = 2;
    if (numStr.length >= 3) {
      digitScale = 1;
    } else if (numStr.length === 1 && W >= 54) {
      digitScale = 2;
    }

    const digitWidth = 5 * digitScale;
    const digitSpacing = 1 * digitScale;
    const totalNumWidth = numStr.length * digitWidth + (numStr.length - 1) * digitSpacing;
    const totalNumHeight = 7 * digitScale;

    // Number sits in the belly of the flame / center of 3D sphere
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
      // 0..24: Intense 3D Particle Sphere rotating around number
      // 25..50: 3D Flame Vortex Spin (high-speed orbital spin in 3D)
      // 51..72: Ignites upward into branching pixel flame model
      // 72+: Continuous authentic branching green flames with living tongues
      let spinSpeed = 0.06;
      let flameMorph = 0.0;

      if (frameCount < 24) {
        spinSpeed = 0.06;
        flameMorph = 0.0;
      } else if (frameCount < 50) {
        const p = (frameCount - 24) / 26;
        spinSpeed = 0.06 + p * 0.32; // Intense acceleration in 3D
        flameMorph = Math.max(0, (p - 0.55) / 0.45);
      } else if (frameCount < 74) {
        const p = (frameCount - 50) / 24;
        spinSpeed = 0.38 * (1 - p);
        flameMorph = 0.4 + 0.6 * Math.sin(p * Math.PI * 0.5);
      } else {
        spinSpeed = isBoosted ? 0.15 : 0.0;
        flameMorph = 1.0;
      }

      currentSpinAngle += spinSpeed;
      const t = time * 0.003;

      // ── 1. INTENSE 3D SPHERE PROJECTION & DEPTH SORTING ─────────────
      const tiltAngle = 0.36; // 3D tilt for rich spherical depth
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
        p.depth = z2; // -sphereRadius to +sphereRadius

        // High intensity depth shading
        const depthNorm = (z2 + sphereRadius) / (sphereRadius * 2);
        p.heat = Math.max(1, Math.min(7, Math.floor(2 + depthNorm * 5.2)));
        // Front particles: large 2x2 phosphor bloom
        p.size = depthNorm > 0.45 ? 2 : 1;
      }

      // ── 2. AUTHENTIC BRANCHING PIXEL FLAME SIMULATION ──────────────
      // Multi-branch geometry:
      // Base furnace belly around the number (y = cy - 2 to flameBaseY)
      // Multiple separate branching spires reaching upward with deep V-notch air gaps!
      const flameBaseY = Math.floor(H * 0.90);
      const centerTipY = Math.floor(H * 0.08);
      const leftTipY = Math.floor(H * 0.24);
      const rightTipY = Math.floor(H * 0.20);
      const branchRootY = Math.floor(H * 0.56);

      // Sways and curls for each independent branch tongue
      const centerSway = Math.sin(t * 4.0) * 3.5 + Math.sin(t * 7.5) * 1.5;
      const leftCurl = Math.sin(t * 4.8) * 2.2;
      const rightCurl = -Math.cos(t * 5.2) * 2.4;

      // Seed the burning furnace well at the bottom base
      for (let x = 0; x < W; x++) {
        const distFromCenter = Math.abs(x - cx) / (W * 0.36);
        if (distFromCenter < 1.0) {
          const envelope = Math.cos(distFromCenter * (Math.PI / 2));
          const noise = (Math.sin(t * 8 + x * 0.6) + 1) * 0.5;
          const heatBoost = isBoosted ? 2 : 0;
          const baseHeat = Math.min(7, Math.floor((6 + heatBoost) * envelope * (0.8 + 0.2 * noise)));

          for (let r = 0; r < 3; r++) {
            fireBuffer[(flameBaseY - r) * W + x] = Math.random() < 0.94 ? Math.max(0, baseHeat - r) : 0;
          }
        } else {
          for (let r = 0; r < 3; r++) fireBuffer[(flameBaseY - r) * W + x] = 0;
        }
      }

      // Convection step strictly sculptured into multiple distinct branches
      for (let y = 1; y < flameBaseY; y++) {
        for (let x = 0; x < W; x++) {
          const srcIdx = y * W + x;
          const heat = fireBuffer[srcIdx];
          if (heat === 0) continue;

          let inBranch = false;
          let branchHeatBonus = 0;

          // A. Base Furnace Belly (y >= branchRootY): broad rounded body around the number
          if (y >= branchRootY) {
            const p = (y - branchRootY) / (flameBaseY - branchRootY); // 0 to 1
            const baseW = 15 * Math.sin(p * Math.PI * 0.85);
            if (Math.abs(x - cx) <= baseW) {
              inBranch = true;
              branchHeatBonus = 1;
            }
          }

          // B. Upper Branching Spires (y < branchRootY + 2):
          // Three distinct articulated branches separated by air gaps!
          if (y <= branchRootY + 2 && y >= centerTipY) {
            // 1. Center Main Spire
            const pC = (y - centerTipY) / (branchRootY - centerTipY);
            const centerAxis = cx + centerSway * (1 - pC);
            const centerW = 6.0 * Math.sin(Math.min(1, pC) * Math.PI * 0.9);
            if (Math.abs(x - centerAxis) <= centerW) {
              inBranch = true;
              if (Math.abs(x - centerAxis) <= 2) branchHeatBonus = 2; // hot core column
            }

            // 2. Left Branch Tongue (branches way out to the left)
            if (y >= leftTipY) {
              const pL = (y - leftTipY) / (branchRootY - leftTipY);
              const leftAxis = cx - 12 * Math.sin(pL * Math.PI * 0.72) + leftCurl;
              const leftW = 3.8 * Math.sin(pL * Math.PI);
              if (Math.abs(x - leftAxis) <= leftW) {
                inBranch = true;
              }
            }

            // 3. Right Branch Tongue (branches way out to the right)
            if (y >= rightTipY) {
              const pR = (y - rightTipY) / (branchRootY - rightTipY);
              const rightAxis = cx + 13 * Math.sin(pR * Math.PI * 0.75) + rightCurl;
              const rightW = 4.0 * Math.sin(pR * Math.PI);
              if (Math.abs(x - rightAxis) <= rightW) {
                inBranch = true;
              }
            }
          }

          if (!inBranch) {
            // Empty space between branches!
            fireBuffer[srcIdx] = 0;
            continue;
          }

          // Upward convection step along the branch
          const stepY = (y < branchRootY && Math.random() < 0.35) ? 2 : 1;
          const wind = Math.sin(t * 3.5 + y * 0.09) * 0.7;
          const drift = Math.round((Math.random() - 0.5) * 1.5 + wind);

          const destX = Math.min(W - 1, Math.max(0, x + drift));
          const destY = Math.max(0, y - stepY);

          // Decay rate
          const decayProb = branchHeatBonus > 1 ? 0.12 : 0.32;
          const decay = Math.random() < decayProb ? 1 : 0;

          const finalHeat = Math.min(7, heat + (branchHeatBonus > 1 ? 1 : 0));
          fireBuffer[destY * W + destX] = finalHeat >= decay ? finalHeat - decay : 0;
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

      // Layer A: Branching Flame Simulation (weighted by flameMorph)
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

      // Pass 1: Obsidian shadow backing for crisp pixel readability
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
                    data[idx] = 245;
                    data[idx + 1] = 255;
                    data[idx + 2] = 250;
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

      // Layer F: Floating Pixel Embers detaching from the tips of each branch!
      if (flameMorph > 0.45) {
        // Center branch ember
        const emberX = Math.round(cx + centerSway * 0.9);
        const emberY = centerTipY - Math.floor((frameCount % 14) * 0.8);
        if (emberY >= 0 && emberY < centerTipY && emberX >= 0 && emberX < W) {
          setPixel(emberX, emberY, 6);
        }

        // Left branch ember
        const leftEmberX = Math.round(cx - 10 + leftCurl);
        const leftEmberY = leftTipY - Math.floor(((frameCount + 4) % 12) * 0.7);
        if (leftEmberY >= 0 && leftEmberY < leftTipY && leftEmberX >= 0 && leftEmberX < W) {
          setPixel(leftEmberX, leftEmberY, 5);
        }

        // Right branch ember
        const rightEmberX = Math.round(cx + 11 + rightCurl);
        const rightEmberY = rightTipY - Math.floor(((frameCount + 8) % 12) * 0.7);
        if (rightEmberY >= 0 && rightEmberY < rightTipY && rightEmberX >= 0 && rightEmberX < W) {
          setPixel(rightEmberX, rightEmberY, 5);
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
      {/* Radiant Neon Volt Aura behind the Flame */}
      <div
        className={`absolute w-36 h-48 rounded-full bg-emerald-500/25 blur-2xl pointer-events-none transition-all duration-300 ${
          isStoked ? "scale-120 opacity-100" : "scale-100 opacity-80"
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
