"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface PixelFlameStreakProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  className?: string;
  manualTime?: number;
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

// Fast procedural noise
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
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

float ridgeFbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 3; i++) {
    float n = 1.0 - abs(noise(p));
    v += a * (n * n);
    p = rot * p * 2.04;
    a *= 0.5;
  }
  return v;
}

void main() {
  // Quantize coordinates to discrete pixel art grid (~64x76 cells)
  vec2 pixelGrid = vec2(64.0, 76.0);
  vec2 uv = (floor(v_uv * pixelGrid) + 0.5) / pixelGrid;

  // Aspect ratio correction: width / height
  float aspect = u_resolution.x / u_resolution.y;
  float x = (uv.x - 0.5) * aspect * 2.1; // x = 0 is exact horizontal center
  float y = uv.y;                       // y = 0 at bottom, 1 at top

  float t = u_time;

  // Animation timeline phases:
  // Phase 1 (0.0 - 0.6s): Arcane energy wind-up (compact spherical orb)
  // Phase 2 (0.6 - 1.0s): Charge & compression (pulse, accelerating arcs)
  // Phase 3 (1.0 - 1.5s): Eruption (stretches upward into flames)
  // Phase 4 (1.5 - 2.0s): Flame formation (branches extend)
  // Phase 5 (> 2.0s):     Living flame (continuous organic flicker)
  float t_windup = clamp(t / 0.60, 0.0, 1.0);
  float t_charge = clamp((t - 0.60) / 0.40, 0.0, 1.0);
  float t_erupt = clamp((t - 1.00) / 0.50, 0.0, 1.0);

  // Morph factor m: 0.0 during windup & charge, smooth transition during eruption
  float m = 0.5 - 0.5 * cos(t_erupt * 3.14159265);

  // ══════════════════════════════════════════════════
  // 1. SPHERICAL ARCANE ENERGY ORB (Ignition & Charge)
  // ══════════════════════════════════════════════════
  // Isotropic circular coordinates centered at (x = 0, y = 0.40)
  // Exactly 1:1 on screen without vertical elongation
  vec2 p_orb = vec2((uv.x - 0.5) * aspect, uv.y - 0.40);
  float r_orb = length(p_orb);
  float ang_orb = atan(p_orb.y, p_orb.x);

  // Compact spherical orb gathering energy, slight compression pulse during charge
  float R_base = 0.138;
  float growth = mix(0.42, 1.0, smoothstep(0.0, 0.55, t_windup));
  float compression = 1.0 - 0.09 * sin(t_charge * 3.14159265);
  float R_curr = R_base * growth * compression;

  // 3D Spherical Volume Normal & Surface Turbulence
  float r_norm = r_orb / max(0.001, R_curr);
  float z_sph = sqrt(max(0.0, 1.0 - min(1.0, r_norm * r_norm)));

  float turb_speed = 3.6 + 4.5 * t_charge;
  float orb_turb = 0.10 * noise(vec2(cos(ang_orb) * 3.5 + t * turb_speed, sin(ang_orb) * 3.5 - t * turb_speed))
                 + 0.06 * fbm(vec2(p_orb.x * 24.0, p_orb.y * 24.0 - t * 4.0));
  float orb_edge = smoothstep(1.10 + orb_turb, 0.80 + orb_turb, r_norm);

  // Luminous Concentrated Mint Core
  float core_pulse = 0.07 * sin(t * (7.0 + 13.0 * t_charge));
  float core_r = (0.50 - 0.16 * t_charge) + core_pulse;
  float core_heat = smoothstep(core_r, 0.0, r_norm);
  // Controlled pre-eruption flash (t ~ 0.92s - 1.02s)
  float flash = smoothstep(0.85, 0.98, t_charge) * (1.0 - t_erupt) * 0.45;
  core_heat += flash;

  // Rotating Irregular Arcane Arcs wrapping in 3D perspective
  float arc_rot = t * (4.2 + 5.5 * t_charge);

  // Arc 1 (Tilted +32 degrees)
  mat2 rot1 = mat2(0.848, -0.530, 0.530, 0.848);
  vec2 p_arc1 = rot1 * p_orb;
  p_arc1.y *= 1.85; // Perspective foreshortening
  float d_arc1 = abs(length(p_arc1) - R_curr * 1.26);
  float arc1_env = smoothstep(0.016, 0.0, d_arc1);
  float ang1 = atan(p_arc1.y, p_arc1.x);
  float arc1_mask = smoothstep(0.18, 0.72, sin(ang1 * 1.5 - arc_rot));
  float arc1 = arc1_env * arc1_mask * 0.75;

  // Arc 2 (Tilted -42 degrees)
  mat2 rot2 = mat2(0.743, 0.669, -0.669, 0.743);
  vec2 p_arc2 = rot2 * p_orb;
  p_arc2.y *= 1.95;
  float d_arc2 = abs(length(p_arc2) - R_curr * 1.44);
  float arc2_env = smoothstep(0.014, 0.0, d_arc2);
  float ang2 = atan(p_arc2.y, p_arc2.x);
  float arc2_mask = smoothstep(0.22, 0.76, sin(ang2 * 2.0 + arc_rot * 1.25 + 1.8));
  float arc2 = arc2_env * arc2_mask * 0.65;

  // Arc 3 (Equatorial close wrapping arc)
  vec2 p_arc3 = vec2(p_orb.x, p_orb.y * 2.5);
  float d_arc3 = abs(length(p_arc3) - R_curr * 1.05);
  float arc3_env = smoothstep(0.013, 0.0, d_arc3);
  float ang3 = atan(p_arc3.y, p_arc3.x);
  float arc3_mask = smoothstep(0.30, 0.80, sin(ang3 * 3.0 - arc_rot * 1.4));
  float arc3 = arc3_env * arc3_mask * 0.55;

  // Curved Swirling Energy Wisps (drawn inward before release)
  float wisp_inward = 14.0 * t_charge;
  float wisp1 = sin(ang_orb * 3.0 + r_orb * 32.0 - t * 7.5 - wisp_inward);
  float wisp2 = cos(ang_orb * 4.0 - r_orb * 24.0 + t * 9.5);
  float wisp_zone = smoothstep(R_curr * 1.70, R_curr * 0.85, r_orb) * smoothstep(R_curr * 0.35, R_curr * 0.75, r_orb);
  float wisps = max(0.0, wisp1 * 0.5 + wisp2 * 0.5) * wisp_zone * 0.48;

  // Orbiting Procedural Arcane Sparks
  float dot_sparks = step(0.93, sin(ang_orb * 6.0 - arc_rot * 2.0) * sin(r_orb * 42.0 + t * 6.0))
                   * smoothstep(R_curr * 1.45, R_curr * 0.65, r_orb) * 0.45;

  // Composite Arcane Energy Orb Heat
  float orb_body = orb_edge * (0.42 + 0.36 * z_sph + 0.16 * orb_turb);
  float orb_total_heat = orb_body + core_heat * 0.68 + (arc1 + arc2 + arc3 + wisps + dot_sparks) * (1.0 - m * 0.85);

  // ══════════════════════════════════════════════════
  // 2. TAPERED MULTI-TONGUE FLAME SILHOUETTE
  // ══════════════════════════════════════════════════
  // Vertical position: settle base smoothly from y = 0.36 to 0.15 during eruption
  float y_base = mix(0.36, 0.15, m);
  float dy = (y - y_base) / 0.80; // normalized flame height [0, 1]

  // Convective upward flow coordinate
  float flow_y = dy * 3.8 - t * 5.2;

  // Tongue sprouting progression during eruption
  float branch_sprout = smoothstep(0.12, 0.88, m);
  float spur_sprout = smoothstep(0.35, 0.98, m);

  // A. Hearth Base & Belly (Rounded teardrop framing streak number at y = 0.40)
  float belly_w = 0.28 * sqrt(max(0.0, 1.0 - pow((dy - 0.25) / 0.28, 2.0)));
  float env_belly = clamp(1.0 - abs(x) / max(0.01, belly_w), 0.0, 1.0) * smoothstep(-0.05, 0.03, dy);

  // B. Central Spire (Primary tallest energetic plume)
  float tip_flick_C = 0.030 * sin(flow_y * 2.2 + 1.0) * smoothstep(0.55, 0.95, dy);
  float sway_C = 0.020 * sin(flow_y * 1.4) + tip_flick_C;
  float tip_C = 0.95 + 0.05 * sin(t * 5.8);
  float w_C = 0.16 * pow(max(0.0, 1.0 - dy / tip_C), 0.85);
  float env_C = clamp(1.0 - abs(x - sway_C) / max(0.01, w_C), 0.0, 1.0) * step(0.0, dy) * step(dy, tip_C);

  // C. Left Major Branch Tongue (Tapered, reaches dy ~ 0.74)
  float tip_flick_L = 0.022 * sin(flow_y * 2.4) * smoothstep(0.40, 0.74, dy);
  float sway_L = -0.19 - 0.03 * sin(flow_y * 1.6 + 1.2) + tip_flick_L;
  float tip_L = (0.74 + 0.06 * sin(t * 5.2 + 2.1)) * branch_sprout;
  float w_L = 0.11 * pow(max(0.0, 1.0 - (dy - 0.14) / max(0.01, tip_L - 0.14)), 0.80);
  float env_L = clamp(1.0 - abs(x - sway_L) / max(0.01, w_L), 0.0, 1.0) * step(0.12, dy) * step(dy, tip_L) * branch_sprout;

  // D. Right Major Branch Tongue (Asymmetric organic height, reaches dy ~ 0.82)
  float tip_flick_R = 0.022 * sin(flow_y * 2.4 + 2.0) * smoothstep(0.40, 0.82, dy);
  float sway_R = 0.20 + 0.03 * sin(flow_y * 1.6 + 3.8) + tip_flick_R;
  float tip_R = (0.82 + 0.06 * sin(t * 5.5 + 4.2)) * branch_sprout;
  float w_R = 0.11 * pow(max(0.0, 1.0 - (dy - 0.14) / max(0.01, tip_R - 0.14)), 0.80);
  float env_R = clamp(1.0 - abs(x - sway_R) / max(0.01, w_R), 0.0, 1.0) * step(0.12, dy) * step(dy, tip_R) * branch_sprout;

  // E. Outer Flank Tendrils (Short licking spurs)
  float sway_FL = -0.28 - 0.02 * sin(flow_y * 2.0);
  float tip_FL = (0.50 + 0.05 * sin(t * 6.5 + 1.0)) * spur_sprout;
  float w_FL = 0.065 * pow(max(0.0, 1.0 - (dy - 0.16) / max(0.01, tip_FL - 0.16)), 0.65);
  float env_FL = clamp(1.0 - abs(x - sway_FL) / max(0.01, w_FL), 0.0, 1.0) * step(0.14, dy) * step(dy, tip_FL) * spur_sprout;

  float sway_FR = 0.29 + 0.02 * sin(flow_y * 2.0 + 2.7);
  float tip_FR = (0.48 + 0.05 * sin(t * 6.2 + 3.4)) * spur_sprout;
  float w_FR = 0.065 * pow(max(0.0, 1.0 - (dy - 0.16) / max(0.01, tip_FR - 0.16)), 0.65);
  float env_FR = clamp(1.0 - abs(x - sway_FR) / max(0.01, w_FR), 0.0, 1.0) * step(0.14, dy) * step(dy, tip_FR) * spur_sprout;

  // Cleft Notches: Carve negative space between tongues
  float cleft_L = clamp(1.0 - abs(x - (-0.098)) / 0.034, 0.0, 1.0) * step(0.34, dy) * step(dy, 0.75);
  float cleft_R = clamp(1.0 - abs(x - (0.098)) / 0.034, 0.0, 1.0) * step(0.34, dy) * step(dy, 0.82);
  float cleft_FL = clamp(1.0 - abs(x - (-0.235)) / 0.028, 0.0, 1.0) * step(0.22, dy) * step(dy, 0.52);
  float cleft_FR = clamp(1.0 - abs(x - (0.240)) / 0.028, 0.0, 1.0) * step(0.22, dy) * step(dy, 0.50);

  float composite_tongues = max(env_belly, max(env_C, max(env_L, max(env_R, max(env_FL, env_FR)))));
  float carved_silhouette = clamp(composite_tongues - 0.65 * branch_sprout * max(max(cleft_L, cleft_R), max(cleft_FL, cleft_FR)), 0.0, 1.0);

  // Micro-notches for authentic pixel fire irregularity
  float micro_notches = 0.14 * fbm(vec2(x * 12.0, flow_y * 1.8));
  float flame_silhouette = clamp(carved_silhouette + micro_notches * step(0.1, carved_silhouette), 0.0, 1.0);

  // ══════════════════════════════════════════════════
  // 3. INTERNAL TEXTURE & HIERARCHY LAYERING
  // ══════════════════════════════════════════════════
  float vert_filaments = 0.26 * ridgeFbm(vec2(x * 10.0, flow_y * 2.2));
  float vert_streaks = 0.22 * fbm(vec2(x * 14.0, flow_y * 1.6));

  // Concentrated Core shape centered around streak number (dy ~ 0.28)
  float core_flow = dy * 4.5 - t * 6.5;
  float core_streaks = fbm(vec2(x * 16.0, core_flow));
  float core_shape = exp(-pow(x / 0.10, 2.0) - pow((dy - 0.28) / 0.22, 2.0));
  float flame_core_intensity = core_shape * (0.80 + 0.35 * core_streaks);

  // Layered edge separation: outer perimeter falls off into rich forest and pine
  float edge_falloff = smoothstep(0.04, 0.50, carved_silhouette);
  float flame_heat = flame_silhouette * (0.22 + 0.38 * edge_falloff + vert_filaments + vert_streaks) + flame_core_intensity * 0.65;
  flame_heat *= step(0.04, flame_silhouette);

  // Sparks breaking off tips
  float spark_grid = fbm(vec2(x * 22.0, flow_y * 3.5));
  float sparks = step(0.68, spark_grid) * step(0.65, dy) * step(dy, 0.98) * clamp(1.0 - abs(x) / 0.35, 0.0, 1.0) * 0.35;
  flame_heat += sparks;

  // ══════════════════════════════════════════════════
  // 4. CONTINUOUS SPHERICAL ERUPTION MORPHING
  // ══════════════════════════════════════════════════
  float total_heat = mix(orb_total_heat, flame_heat, m);

  // Dynamic tearing wisps during eruption burst (confined to emerging flame envelope)
  float erupt_burst = sin(m * 3.14159265);
  if (erupt_burst > 0.01 && y > 0.38 && y < 0.85) {
    float flame_env_x = smoothstep(0.24 * (1.0 - (y - 0.38) * 1.5), 0.0, abs(x));
    float tear_wisps = 0.30 * erupt_burst * flame_env_x * fbm(vec2(x * 14.0, (y - 0.40) * 12.0 - t * 8.0));
    total_heat += tear_wisps * smoothstep(0.38, 0.55, y);
  }

  total_heat *= (1.0 + 0.22 * u_boost);

  // ══════════════════════════════════════════════════
  // 5. AUTHENTIC 7-BAND PIXEL-ART VOLT PALETTE
  // ══════════════════════════════════════════════════
  vec4 color = vec4(0.0);

  if (total_heat >= 0.10 && total_heat < 0.24) {
    color = vec4(0.04, 0.14, 0.08, 0.85); // Pine border
  } else if (total_heat >= 0.24 && total_heat < 0.40) {
    color = vec4(0.06, 0.31, 0.16, 0.92); // Forest emerald
  } else if (total_heat >= 0.40 && total_heat < 0.56) {
    color = vec4(0.09, 0.54, 0.27, 0.98); // Vivid emerald
  } else if (total_heat >= 0.56 && total_heat < 0.72) {
    color = vec4(0.13, 0.77, 0.37, 1.0);  // Signature Neon Volt
  } else if (total_heat >= 0.72 && total_heat < 0.85) {
    color = vec4(0.29, 0.87, 0.50, 1.0);  // Electric Lime-Volt
  } else if (total_heat >= 0.85 && total_heat < 0.95) {
    color = vec4(0.65, 0.95, 0.82, 1.0);  // Cyber Mint
  } else if (total_heat >= 0.95) {
    color = vec4(0.96, 1.00, 0.98, 1.0);  // Incandescent White Core
  }

  gl_FragColor = color;
}
`;

export function PixelFlameStreak({
  streak,
  size = "md",
  interactive = true,
  className = "",
  manualTime,
}: PixelFlameStreakProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streakNumRef = useRef<HTMLDivElement | null>(null);
  const [isStoked, setIsStoked] = useState(false);
  const stokeRef = useRef<number>(0);
  const eruptBurstFiredRef = useRef<boolean>(false);

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
        antialias: false, // Crisp pixel art edges
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

    // Dynamic Arcane & Pixel Embers Simulation
    const particles: EmberParticle[] = [];
    const MAX_PARTICLES = 40;

    const spawnEmber = (t: number, isBurst = false): EmberParticle => {
      let originX = W * 0.5;
      let originY = H * 0.60;
      let vx = 0;
      let vy = 0;

      if (t < 0.60) {
        // Phase 1: Arcane gathering - Orbiting sparks
        const ang = Math.random() * Math.PI * 2;
        const r = (20 + Math.random() * 26) * dpr;
        originX = W * 0.5 + Math.cos(ang) * r;
        originY = H * 0.60 + Math.sin(ang) * (r * 0.85);
        const tang = ang + Math.PI * 0.5;
        const speed = (0.7 + Math.random() * 0.9);
        vx = Math.cos(tang) * speed * dpr;
        vy = Math.sin(tang) * speed * 0.85 * dpr;
      } else if (t < 1.00) {
        // Phase 2: Charging - Accelerating inward spiral
        const ang = Math.random() * Math.PI * 2;
        const r = (18 + Math.random() * 32) * dpr;
        originX = W * 0.5 + Math.cos(ang) * r;
        originY = H * 0.60 + Math.sin(ang) * (r * 0.85);
        const tang = ang + Math.PI * 0.5;
        const speed = (1.4 + Math.random() * 1.6);
        vx = (Math.cos(tang) - Math.cos(ang) * 0.35) * speed * dpr;
        vy = (Math.sin(tang) - Math.sin(ang) * 0.35) * speed * 0.85 * dpr;
      } else if (t < 1.40 || isBurst) {
        // Phase 3: Eruption burst
        originX = W * 0.5 + (Math.random() - 0.5) * 28 * dpr;
        originY = H * 0.60 + (Math.random() - 0.5) * 20 * dpr;
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.5;
        const speed = (isBurst ? 2.2 : 1.6) + Math.random() * 2.4;
        vx = Math.cos(angle) * speed * dpr;
        vy = Math.sin(angle) * speed * dpr;
      } else {
        // Phase 5: Living flame steady rising embers
        originX = W * 0.5 + (Math.random() - 0.5) * 52 * dpr;
        originY = H * (0.80 - Math.random() * 0.55);
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.85;
        const speed = 0.7 + Math.random() * 1.4;
        vx = Math.cos(angle) * speed * dpr;
        vy = -Math.abs(Math.sin(angle)) * speed * 1.5 * dpr;
      }

      const driftSeed = Math.random() * 1000;
      const lifeMax = 28 + Math.random() * 32;

      const isWhite = Math.random() < 0.22;
      const isMint = Math.random() < 0.48;
      const color: [number, number, number] = isWhite
        ? [245, 255, 250]
        : isMint
        ? [101, 242, 209]
        : [34, 197, 94];

      return {
        x: originX,
        y: originY,
        vx,
        vy,
        size: Math.max(2, Math.round((1.5 + Math.random() * 1.8) * dpr)),
        color,
        alpha: 0.85 + Math.random() * 0.15,
        life: 0,
        maxLife: lifeMax,
        driftSeed,
      };
    };

    let animationFrameId: number;
    const startTime = performance.now();

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const elapsedSec = manualTime !== undefined ? manualTime : (now - startTime) * 0.001;
      const effectiveTime = prefersReducedMotion ? elapsedSec * 0.4 : elapsedSec;

      // Update streak counter visibility & subtle scale rhythm across animation phases
      if (streakNumRef.current) {
        if (effectiveTime < 0.25) {
          const fadeIn = Math.min(1.0, effectiveTime / 0.25);
          streakNumRef.current.style.opacity = fadeIn.toString();
          streakNumRef.current.style.transform = "translate(-50%, -50%) scale(0.92)";
        } else if (effectiveTime < 0.60) {
          // Arcane gathering: steady, legible, centered
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = "translate(-50%, -50%) scale(0.95)";
        } else if (effectiveTime < 1.00) {
          // Charging compression: energetic subtle pulse
          const chargeNorm = (effectiveTime - 0.60) / 0.40;
          const pulse = 0.95 + 0.05 * Math.sin(chargeNorm * Math.PI * 4);
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${pulse})`;
        } else if (effectiveTime < 1.50) {
          // Eruption: smoothly transition to full size
          const eruptNorm = (effectiveTime - 1.00) / 0.50;
          const scaleVal = 0.95 + 0.05 * eruptNorm;
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;
        } else {
          // Living flame: fully stable at scale 1.0
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = "translate(-50%, -50%) scale(1.0)";
        }
      }

      // Trigger eruption particle burst once as flame ignites
      if (effectiveTime >= 1.00 && effectiveTime <= 1.35 && !eruptBurstFiredRef.current) {
        eruptBurstFiredRef.current = true;
        for (let i = 0; i < 18; i++) {
          particles.push(spawnEmber(effectiveTime, true));
        }
      } else if (effectiveTime < 0.90) {
        eruptBurstFiredRef.current = false;
      }

      // Handle stoke boost decay
      if (stokeRef.current > 0.01) {
        stokeRef.current *= 0.93;
        if (particles.length < MAX_PARTICLES + 12) {
          particles.push(spawnEmber(effectiveTime, true));
        }
      } else {
        stokeRef.current = 0.0;
      }

      // ── 1. RENDER WEBGL PIXEL FLAME BODY ──
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

      // ── 2. RENDER PIXEL EMBERS ON CANVAS 2D ──
      if (pCtx) {
        pCtx.clearRect(0, 0, W, H);

        // Spawn steady ambient embers
        if (particles.length < MAX_PARTICLES && Math.random() < 0.50) {
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
          p.vy -= (effectiveTime < 1.0 ? 0.01 : 0.035) * dpr;
          const drift = Math.sin(effectiveTime * 4.5 + p.driftSeed) * 0.35 * dpr;
          p.x += p.vx + drift;
          p.y += p.vy;

          const curAlpha = p.alpha * fade;
          const pxSize = Math.max(2, Math.round(p.size * (1.0 - lifeNorm * 0.3)));
          const pxX = Math.round(p.x);
          const pxY = Math.round(p.y);

          pCtx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${curAlpha})`;
          pCtx.fillRect(pxX, pxY, pxSize, pxSize);
        }
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
  }, [dimensions, size, manualTime]);

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
          className="absolute top-[60%] left-1/2 pointer-events-none select-none flex flex-col items-center justify-center transition-transform duration-75 z-10"
          style={{
            opacity: manualTime !== undefined ? 1 : 0,
            transform: "translate(-50%, -50%) scale(0.95)",
          }}
        >
          <span
            className={`font-mono font-black text-white ${dimensions.numSize} tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]`}
            style={{
              WebkitTextStroke:
                size === "lg"
                  ? "2px #02160e"
                  : size === "sm"
                  ? "1.2px #02160e"
                  : "1.5px #02160e",
              paintOrder: "stroke fill",
            }}
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
