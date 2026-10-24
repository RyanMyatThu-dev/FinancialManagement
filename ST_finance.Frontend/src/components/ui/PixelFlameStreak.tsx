"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface PixelFlameStreakProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
}

interface EmberParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: [number, number, number];
  alpha: number;
  life: number;
  maxLife: number;
  driftSeed: number;
  isStreak: boolean;
}

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_boost;

// Fast hash and procedural noise
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.852, 0.523, -0.523, 0.852);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.04;
    a *= 0.5;
  }
  return v;
}

float ridgeFbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.796, 0.605, -0.605, 0.796);
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(noise(p));
    v += a * (n * n);
    p = rot * p * 2.06;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Convert screen coordinates to strictly isotropic 1:1 metric coordinates
  float scale = u_resolution.y * 0.62;
  vec2 pixelPos = v_uv * u_resolution;

  float x = (pixelPos.x - u_resolution.x * 0.5) / scale;
  float y = (pixelPos.y - u_resolution.y * 0.20) / scale; // y=0 at base, increases upwards!

  float t = u_time;
  float ign_factor = clamp(t / 0.45, 0.0, 1.0);
  float erupt_factor = clamp((t - 0.45) / 0.65, 0.0, 1.0);
  float m = 0.5 - 0.5 * cos(erupt_factor * 3.14159265);

  // ── CONTINUOUS BASE POSITION ──
  float y_base = mix(0.32, 0.06, m);
  float dy = y - y_base;

  // ── A. ROARING TURBULENT SPHERE IGNITION (m=0) ──
  // True geometric circle: r = length(vec2(x, dy))
  float r_dist = length(vec2(x, dy));
  float angle = atan(dy, x);

  float swirl_t = t * 4.5;
  float sphere_turb = 0.26 * noise(vec2(cos(angle) * 2.5 + swirl_t * 0.4, sin(angle) * 2.5 - swirl_t * 0.3)) +
                      0.18 * ridgeFbm(vec2(x * 5.0, dy * 5.0 - t * 4.0));
  float r_sphere = 0.24 * (1.0 + sphere_turb) * (0.3 + 0.7 * ign_factor);

  float sphere_density = clamp((r_sphere - r_dist) / (r_sphere * 0.5 + 0.01), 0.0, 1.0);
  float sphere_wisps = ridgeFbm(vec2(x * 8.0, dy * 8.0 - t * 5.0)) * clamp(1.2 - r_dist / 0.28, 0.0, 1.0);
  float sphere_heat = pow(sphere_density, 1.4) * (1.1 + 0.5 * sphere_wisps);

  // ── B. CONTINUOUS ERUPTION & BRANCHING FLAME (m > 0) ──
  float h_max = 0.24 + m * 0.94;
  float h_norm = clamp(dy / (h_max + 0.001), 0.0, 1.3);

  float w_plume = (0.28 * (1.0 - 0.75 * pow(h_norm, 0.8)) + 0.04) * (1.0 + 0.15 * sin(dy * 8.0 - t * 6.0));
  w_plume = max(w_plume, 0.005);

  float y_flow = dy * 1.5 - t * (2.2 + 1.2 * max(0.0, dy));

  // Domain Warping 1 (Large fluid eddies)
  vec2 warp1 = vec2(fbm(vec2(x * 2.6, y_flow)),
                    fbm(vec2(x * 2.6 + 3.7, y_flow + 1.9)));
  vec2 p1 = vec2(x + 0.32 * warp1.x, y_flow + 0.25 * warp1.y);

  // Domain Warping 2 (Fine tearing and licking tendrils)
  float warp2_x = ridgeFbm(vec2(p1.x * 4.0, p1.y * 1.5));
  vec2 p2 = vec2(p1.x + 0.22 * warp2_x, p1.y);

  // Multiple independent dynamic tongue packets
  float tongue_L1 = 0.15 * sin(dy * 5.5 - t * 4.8) * exp(-pow((x + 0.18) / 0.14, 2.0));
  float tongue_R1 = 0.16 * sin(dy * 4.8 - t * 4.2 + 2.1) * exp(-pow((x - 0.16) / 0.15, 2.0));
  float tongue_C  = 0.09 * sin(dy * 7.5 - t * 6.5 + 0.8) * exp(-pow(x / 0.11, 2.0));
  float tongue_L2 = 0.11 * cos(dy * 6.8 - t * 5.2 + 3.4) * exp(-pow((x + 0.28) / 0.12, 2.0));
  float tongue_R2 = 0.12 * sin(dy * 6.0 - t * 5.8 + 1.5) * exp(-pow((x - 0.25) / 0.13, 2.0));

  float total_tongues = tongue_L1 + tongue_R1 + tongue_C + tongue_L2 + tongue_R2;

  float dist_flame = abs(p2.x - total_tongues * 0.7) / w_plume;
  float flame_envelope = clamp(1.0 - pow(dist_flame, 1.6), 0.0, 1.0) * sqrt(clamp(1.0 - h_norm, 0.0, 1.0));

  float fire_noise = fbm(vec2(p2.x * 3.5, p1.y * 2.0));
  float flame_wisps = ridgeFbm(vec2(p2.x * 6.0, p1.y * 3.0));

  float flame_heat = flame_envelope * (0.65 + 0.65 * fire_noise + 0.45 * flame_wisps) - h_norm * 0.45;
  flame_heat = max(0.0, flame_heat) * 1.5;

  // Seamless blend from sphere to flame
  float total_heat = mix(sphere_heat, flame_heat, m);
  float burst = 0.45 * sin(m * 3.14159265) * exp(-pow(r_dist / 0.3, 2.0));
  total_heat += burst + u_boost * 0.4;

  // Soft organic base falloff: no hard horizontal cutoff or pedestal!
  float base_fade = (dy >= 0.0) ? 1.0 : exp(-pow(dy / 0.09, 2.0));
  float top_fade = clamp(1.3 - dy / (h_max + 0.15), 0.0, 1.0);
  total_heat *= base_fade * top_fade;

  // Inner furnace core boost
  float core_glow = exp(-(pow(x / 0.13, 2.0) + pow((dy - 0.12 * m) / 0.16, 2.0))) * (0.65 + 0.4 * m);
  total_heat += core_glow;

  // ── C. EMERALD FIRE COLOR HIERARCHY ──
  vec4 color = vec4(0.0);

  if (total_heat >= 0.04 && total_heat < 0.22) {
    float k = (total_heat - 0.04) / 0.18;
    vec3 c = mix(vec3(0.01, 0.18, 0.09), vec3(0.03, 0.51, 0.24), k);
    color = vec4(c, k * 0.70);
  } else if (total_heat >= 0.22 && total_heat < 0.52) {
    float k = (total_heat - 0.22) / 0.30;
    vec3 c = mix(vec3(0.03, 0.51, 0.24), vec3(0.13, 0.80, 0.38), k);
    color = vec4(c, 0.70 + k * 0.25);
  } else if (total_heat >= 0.52 && total_heat < 0.82) {
    float k = (total_heat - 0.52) / 0.30;
    vec3 c = mix(vec3(0.13, 0.80, 0.38), vec3(0.56, 0.98, 0.72), k);
    color = vec4(c, 0.95 + k * 0.05);
  } else if (total_heat >= 0.82) {
    float k = clamp((total_heat - 0.82) / 0.38, 0.0, 1.0);
    vec3 c = mix(vec3(0.56, 0.98, 0.72), vec3(0.96, 1.0, 0.98), k);
    color = vec4(c, 1.0);
  }

  gl_FragColor = color;
}
`;

export function PixelFlameStreak({
  streak,
  size = "md",
  interactive = true,
  className = "",
}: PixelFlameStreakProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streakNumRef = useRef<HTMLDivElement | null>(null);
  const [isStoked, setIsStoked] = useState(false);
  const stokeRef = useRef<number>(0);

  const dimensions = {
    sm: { cssW: "w-32", cssH: "h-40", numSize: "text-2xl" },
    md: { cssW: "w-44", cssH: "h-52", numSize: "text-3xl" },
    lg: { cssW: "w-52", cssH: "h-62", numSize: "text-4xl" },
  }[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    stokeRef.current = 1.0;
    setIsStoked(true);
    setTimeout(() => setIsStoked(false), 700);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pCanvas = particleCanvasRef.current;
    if (!canvas || !pCanvas) return;

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let positionBuffer: WebGLBuffer | null = null;

    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        depth: false,
      }) || (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }

    const pCtx = pCanvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || 176;
    const cssH = rect.height || 208;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const W = Math.round(cssW * dpr);
    const H = Math.round(cssH * dpr);

    canvas.width = W;
    canvas.height = H;
    pCanvas.width = W;
    pCanvas.height = H;

    let uResolutionLoc: WebGLUniformLocation | null = null;
    let uTimeLoc: WebGLUniformLocation | null = null;
    let uBoostLoc: WebGLUniformLocation | null = null;

    if (gl) {
      const compileShader = (type: number, src: string) => {
        const shader = gl!.createShader(type);
        if (!shader) return null;
        gl!.shaderSource(shader, src);
        gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
          gl!.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
      const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);

      if (vs && fs) {
        program = gl.createProgram();
        if (program) {
          gl.attachShader(program, vs);
          gl.attachShader(program, fs);
          gl.linkProgram(program);

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
            positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
              gl.STATIC_DRAW
            );

            const aPos = gl.getAttribLocation(program, "a_position");
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
            uTimeLoc = gl.getUniformLocation(program, "u_time");
            uBoostLoc = gl.getUniformLocation(program, "u_boost");

            gl.viewport(0, 0, W, H);
          } else {
            program = null;
          }
        }
      }
    }

    // Dynamic Embers / Sparks Simulation
    const particles: EmberParticle[] = [];
    const MAX_PARTICLES = 45;

    const spawnEmber = (t: number, isBurst = false): EmberParticle => {
      const isErupting = t < 1.1;
      const m = Math.min(1.0, Math.max(0.0, (t - 0.45) / 0.65));
      const originY = H * (0.80 - (isErupting ? 0.32 * (1 - m) + 0.08 * m : 0.08));
      const originX = W * 0.5;

      const angle = isErupting && t < 0.45
        ? Math.random() * Math.PI * 2
        : -Math.PI * 0.5 + (Math.random() - 0.5) * 1.3;

      const speed = isBurst
        ? 1.8 + Math.random() * 2.8
        : 0.8 + Math.random() * 1.6;

      const driftSeed = Math.random() * 1000;
      const lifeMax = 35 + Math.random() * 45;

      const isWhite = Math.random() < 0.3;
      const isLime = Math.random() < 0.45;
      const color: [number, number, number] = isWhite
        ? [245, 255, 250]
        : isLime
        ? [134, 239, 172]
        : [34, 197, 94];

      return {
        x: originX + (Math.random() - 0.5) * (isErupting ? 25 : 45) * dpr,
        y: originY + (Math.random() - 0.5) * 15 * dpr,
        vx: Math.cos(angle) * speed * dpr,
        vy: isErupting && t < 0.45
          ? Math.sin(angle) * speed * dpr
          : -Math.abs(Math.sin(angle)) * speed * 1.6 * dpr,
        size: (1.2 + Math.random() * 2.2) * dpr,
        color,
        alpha: 0.85 + Math.random() * 0.15,
        life: 0,
        maxLife: lifeMax,
        driftSeed,
        isStreak: Math.random() < 0.25,
      };
    };

    let animationFrameId: number;
    const startTime = performance.now();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const elapsedSec = (now - startTime) * 0.001;
      const effectiveTime = prefersReducedMotion ? elapsedSec * 0.4 : elapsedSec;

      // Update streak counter visibility smoothly
      if (streakNumRef.current) {
        const morphNorm = Math.max(0.0, Math.min(1.0, (effectiveTime - 0.45) / 0.65));
        const scaleVal = 0.85 + 0.15 * morphNorm;
        streakNumRef.current.style.opacity = morphNorm.toString();
        streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;
      }

      // Handle stoke boost decay
      if (stokeRef.current > 0.01) {
        stokeRef.current *= 0.93;
        if (particles.length < MAX_PARTICLES + 15) {
          particles.push(spawnEmber(effectiveTime, true));
        }
      } else {
        stokeRef.current = 0.0;
      }

      // ── 1. RENDER WEBGL FLAME BODY ──
      if (gl && program) {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        if (uResolutionLoc) gl.uniform2f(uResolutionLoc, W, H);
        if (uTimeLoc) gl.uniform1f(uTimeLoc, effectiveTime);
        if (uBoostLoc) gl.uniform1f(uBoostLoc, stokeRef.current);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (pCtx) {
        pCtx.clearRect(0, 0, W, H);
      }

      // ── 2. RENDER PARTICLE EMBERS ON CANVAS 2D ──
      if (pCtx) {
        pCtx.clearRect(0, 0, W, H);
        pCtx.globalCompositeOperation = "lighter";

        // Spawn steady embers
        if (particles.length < MAX_PARTICLES && Math.random() < 0.65) {
          particles.push(spawnEmber(effectiveTime, false));
        }

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life++;

          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
            continue;
          }

          const lifeNorm = p.life / p.maxLife;
          const fade = Math.sin(lifeNorm * Math.PI);

          // Upward convection drift with turbulent sway
          p.vy -= 0.04 * dpr;
          const drift = Math.sin(effectiveTime * 4.5 + p.driftSeed) * 0.45 * dpr;
          const prevX = p.x;
          const prevY = p.y;
          p.x += p.vx + drift;
          p.y += p.vy;

          const curAlpha = p.alpha * fade;
          const curSize = p.size * (1.0 - lifeNorm * 0.35);

          pCtx.beginPath();
          if (p.isStreak && Math.abs(p.vy) > 1.2 * dpr) {
            // Draw short streak in movement direction
            pCtx.moveTo(prevX, prevY);
            pCtx.lineTo(p.x, p.y);
            pCtx.strokeStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${curAlpha})`;
            pCtx.lineWidth = curSize * 0.9;
            pCtx.stroke();
          } else {
            pCtx.arc(p.x, p.y, curSize, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${curAlpha})`;
            pCtx.shadowBlur = 8 * dpr;
            pCtx.shadowColor = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.8)`;
            pCtx.fill();
          }
        }

        pCtx.shadowBlur = 0;
        pCtx.globalCompositeOperation = "source-over";
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (gl) {
        if (program) gl.deleteProgram(program);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
      }
    };
  }, [dimensions, size]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none group cursor-pointer ${className}`}
      onClick={handleStoke}
      title={interactive ? "Click or tap to stoke the roaring flame!" : undefined}
    >
      {/* Radiant Emerald Aura behind the Flame */}
      <div
        className={`absolute w-44 h-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none transition-all duration-300 ${
          isStoked ? "scale-125 opacity-100 bg-emerald-400/30" : "scale-100 opacity-70"
        }`}
      />

      {/* Flame Container */}
      <div className={`relative ${dimensions.cssW} ${dimensions.cssH} flex items-center justify-center transition-transform duration-200 active:scale-95`}>
        {/* WebGL Procedural Fire Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Dynamic Embers Overlay Canvas */}
        <canvas
          ref={particleCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Crisp Streak Number Centered in the Flame Belly */}
        <div
          ref={streakNumRef}
          className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none flex flex-col items-center justify-center transition-transform duration-75"
          style={{
            opacity: 0,
            transform: "translate(-50%, -50%) scale(0.85)",
          }}
        >
          <span
            className={`font-mono font-black text-white ${dimensions.numSize} tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] [text-shadow:0_0_12px_rgba(74,222,128,0.7)]`}
          >
            {streak}
          </span>
        </div>
      </div>

      {/* Pill Badge */}
      <div className="mt-[-2px] z-10 px-3 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-mono font-bold tracking-widest uppercase text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.3)] flex items-center gap-1.5 backdrop-blur-xs">
        <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-full" />
        {streak === 1 ? "DAY STREAK" : "DAYS BURNING"}
      </div>
    </div>
  );
}
