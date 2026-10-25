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
  // Quantize coordinates to discrete pixel art grid (~60x72 cells for chunky retro pixels)
  vec2 pixelGrid = vec2(60.0, 72.0);
  vec2 uv = (floor(v_uv * pixelGrid) + 0.5) / pixelGrid;

  // Aspect ratio correction: width / height
  float aspect = u_resolution.x / u_resolution.y;
  float x = (uv.x - 0.5) * aspect * 2.0; // x = 0 is exact horizontal center
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
  float core_base = smoothstep(core_r, 0.0, r_norm);
  // Controlled pre-eruption flash - strictly confined to the orb core mask!
  float flash = smoothstep(0.85, 0.98, t_charge) * (1.0 - t_erupt) * 0.45;
  float core_heat = core_base + flash * smoothstep(core_r * 1.35, 0.0, r_norm);

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

  // Composite Arcane Energy Orb Heat with strict spatial boundary
  float orb_envelope = smoothstep(R_curr * 1.82, R_curr * 1.55, r_orb);
  float orb_body = orb_edge * (0.42 + 0.36 * z_sph + 0.16 * orb_turb);
  float orb_total_heat = (orb_body + core_heat * 0.68 + (arc1 + arc2 + arc3 + wisps + dot_sparks) * (1.0 - m * 0.85)) * orb_envelope;

  // ══════════════════════════════════════════════════
  // 2. CLASSIC 3-TONGUE RETRO PIXEL FLAME SILHOUETTE
  // ══════════════════════════════════════════════════
  // Vertical position: settle base smoothly from y = 0.36 to 0.16 during eruption
  float y_base = mix(0.36, 0.16, m);
  float dy = (y - y_base) / 0.74; // normalized flame height [0, 1]

  // Convective upward flow coordinates (differential speeds for living fire dynamics)
  float flow_y = dy * 3.8 - t * 4.6;

  // Sprouting progression during eruption
  float body_sprout = smoothstep(0.02, 0.70, m);
  float branch_sprout = smoothstep(0.12, 0.88, m);

  // A. Hearth Base & Lower Belly: Flaring wide at the base (strictly ~1.4x taller than wide)
  float dy_base = dy - 0.24;
  float lower_flare = sqrt(max(0.0, 1.0 - pow(clamp((0.24 - dy) / 0.22, 0.0, 1.0), 2.0)));
  float upper_taper = pow(max(0.0, 1.0 - clamp(dy_base / 0.26, 0.0, 1.0)), 0.72);
  float base_profile = dy <= 0.24 ? lower_flare : upper_taper;

  // Half-width ~0.42 at widest point, guaranteeing classic 1.4:1 vertical proportions
  float base_w = (0.42 + 0.015 * sin(t * 2.8 + dy * 4.5)) * base_profile;

  float env_belly = smoothstep(1.0, 0.15, abs(x) / max(0.01, base_w))
                  * smoothstep(-0.02, 0.06, dy)
                  * smoothstep(0.54, 0.38, dy)
                  * body_sprout;

  // B. Three Distinct Upward Tongues / Peaks:
  // 1. Center Tongue: Tallest vertical plume with pointed tip at top
  float tip_C = 0.94 + 0.035 * sin(t * 3.4);
  float p_C = clamp((dy - 0.18) / max(0.01, tip_C - 0.18), 0.0, 1.0);
  float sway_C = (0.024 * sin(t * 2.6 + p_C * 3.2) + 0.014 * sin(p_C * 4.8 - t * 3.8)) * pow(p_C, 1.15);
  float w_C = 0.20 * pow(1.0 - p_C, 0.80) * (0.86 + 0.28 * sin(p_C * 3.14159));
  float env_C = smoothstep(1.0, 0.16, abs(x - sway_C) / max(0.006, w_C)) * step(0.16, dy) * step(dy, tip_C) * branch_sprout;

  // 2. Left Tongue: Distinct upward peak, slightly shorter than center
  float tip_L = (0.78 + 0.032 * sin(t * 3.8 + 1.2)) * branch_sprout;
  float p_L = clamp((dy - 0.20) / max(0.01, tip_L - 0.20), 0.0, 1.0);
  float x_L = -0.08 - (0.17 + 0.020 * sin(t * 2.5 + 0.8)) * sin(p_L * 2.1) + 0.015 * sin(flow_y * 1.8) * p_L;
  float w_L = 0.165 * pow(1.0 - p_L, 0.75) * (0.85 + 0.30 * sin(p_L * 3.14159));
  float env_L = smoothstep(1.0, 0.16, abs(x - x_L) / max(0.006, w_L)) * step(0.18, dy) * step(dy, tip_L) * branch_sprout;

  // 3. Right Tongue: Distinct upward peak, slightly shorter than center
  float tip_R = (0.80 + 0.032 * sin(t * 3.6 + 2.4)) * branch_sprout;
  float p_R = clamp((dy - 0.20) / max(0.01, tip_R - 0.20), 0.0, 1.0);
  float x_R = 0.08 + (0.17 + 0.020 * sin(t * 2.3 + 1.9)) * sin(p_R * 2.1) - 0.015 * sin(flow_y * 1.8) * p_R;
  float w_R = 0.165 * pow(1.0 - p_R, 0.75) * (0.85 + 0.30 * sin(p_R * 3.14159));
  float env_R = smoothstep(1.0, 0.16, abs(x - x_R) / max(0.006, w_R)) * step(0.18, dy) * step(dy, tip_R) * branch_sprout;

  // Deep clefts separating the 3 tongues
  float cleft_LC = clamp(1.0 - abs(x - mix(x_L, sway_C, 0.50)) / 0.055, 0.0, 1.0)
                 * smoothstep(0.42, 0.60, dy) * step(dy, min(tip_L, tip_C));
  float cleft_RC = clamp(1.0 - abs(x - mix(x_R, sway_C, 0.50)) / 0.055, 0.0, 1.0)
                 * smoothstep(0.42, 0.60, dy) * step(dy, min(tip_R, tip_C));

  float composite_tongues = max(env_belly, max(env_C, max(env_L, env_R)));
  float carved_silhouette = clamp(composite_tongues - 0.55 * branch_sprout * max(cleft_LC, cleft_RC), 0.0, 1.0);

  // Micro-notches for authentic retro pixel stepping at fire edges
  float micro_notches = 0.09 * fbm(vec2(x * 9.5 + 0.14 * sin(flow_y * 1.5), flow_y * 1.8));
  float flame_silhouette = clamp(carved_silhouette + micro_notches * step(0.08, carved_silhouette), 0.0, 1.0);

  // ══════════════════════════════════════════════════
  // 3. LAYERED INTERNAL TEXTURE & HIGHLIGHT CORE
  // ══════════════════════════════════════════════════
  // Base body heat: edge falls off into pine/forest emerald, bulk of body is vivid emerald
  float edge_dist = smoothstep(0.04, 0.36, carved_silhouette);
  float body_heat = 0.18 + 0.38 * edge_dist;

  // Convective swirling flame filaments
  vec2 flow_uv = vec2(x * 6.0 + 0.16 * sin(flow_y * 1.4), flow_y * 1.5);
  float vert_filaments = 0.12 * ridgeFbm(flow_uv);
  float vert_streaks = 0.08 * fbm(flow_uv * 1.30 + vec2(1.9, -1.0));

  // Tongue spine highlights along the 3 tongues
  float spine_C = smoothstep(w_C * 0.50, 0.0, abs(x - sway_C)) * smoothstep(0.24, 0.40, dy) * smoothstep(tip_C, tip_C - 0.12, dy);
  float spine_L = smoothstep(w_L * 0.48, 0.0, abs(x - x_L)) * smoothstep(0.26, 0.42, dy) * smoothstep(tip_L, tip_L - 0.12, dy);
  float spine_R = smoothstep(w_R * 0.48, 0.0, abs(x - x_R)) * smoothstep(0.26, 0.42, dy) * smoothstep(tip_R, tip_R - 0.12, dy);
  float tongue_spines = (spine_C * 0.20 + spine_L * 0.14 + spine_R * 0.14);

  // Bright white diamond/oval-shaped highlight in center that forms a soft "V" or teardrop of light
  // Centered around streak digit at dy ~ 0.28
  float dy_core = dy - 0.28;
  float lower_core = sqrt(max(0.0, 1.0 - pow(clamp(-dy_core / 0.16, 0.0, 1.0), 2.0)));
  float upper_core = pow(max(0.0, 1.0 - clamp(dy_core / 0.24, 0.0, 1.0)), 1.15);
  float core_profile = dy_core <= 0.0 ? lower_core : upper_core;
  float core_w = 0.19 * core_profile;
  float core_teardrop = smoothstep(1.0, 0.15, abs(x) / max(0.005, core_w)) * step(-0.16, dy_core) * step(dy_core, 0.24);

  // Upward soft V-highlight branching gently toward the center/side clefts
  float soft_v = smoothstep(0.0, 0.20, dy_core) * smoothstep(0.04, 0.14, abs(x)) * smoothstep(0.26, 0.08, dy_core) * 0.45;
  float core_light = max(core_teardrop, soft_v);

  float core_flow = dy * 4.6 - t * 6.8;
  float core_streaks = 0.12 * fbm(vec2(x * 14.0 + 0.10 * sin(core_flow * 1.4), core_flow * 1.3));
  float flame_core_intensity = core_light * (0.85 + core_streaks);

  float inner_heat = tongue_spines + flame_core_intensity * 0.72;

  float flame_heat = (body_heat + vert_filaments + vert_streaks + inner_heat) * flame_silhouette;
  flame_heat *= step(0.04, flame_silhouette);

  // Small 1-pixel sparks floating above the tips
  float spark_grid = fbm(vec2(x * 24.0, flow_y * 3.8));
  float sparks = step(0.72, spark_grid) * step(0.68, dy) * step(dy, 0.98) * clamp(1.0 - abs(x) / 0.36, 0.0, 1.0) * 0.30;
  flame_heat += sparks;

  // ══════════════════════════════════════════════════
  // 4. CONTINUOUS SPHERICAL ERUPTION MORPHING
  // ══════════════════════════════════════════════════
  float total_heat = mix(orb_total_heat, flame_heat, m);

  // Dynamic tearing wisps during eruption burst (widened to match new body envelope)
  float erupt_burst = sin(m * 3.14159265);
  if (erupt_burst > 0.01 && y > 0.38 && y < 0.85) {
    float flame_env_x = smoothstep(0.32 * (1.0 - (y - 0.38) * 1.2), 0.0, abs(x));
    float tear_wisps = 0.30 * erupt_burst * flame_env_x * fbm(vec2(x * 14.0, (y - 0.40) * 12.0 - t * 8.0));
    total_heat += tear_wisps * smoothstep(0.38, 0.55, y);
  }

  // Master spatial boundary: STRICTLY guarantee 0 alpha & 0 color outside active flame/orb geometry
  float active_envelope = max(orb_envelope * (1.0 - m * 0.9), flame_silhouette);
  total_heat *= smoothstep(0.01, 0.06, active_envelope);

  // Strict transparent background cutoff: pixels outside flame/orb MUST be zero RGB and zero alpha
  if (total_heat < 0.10) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  total_heat *= (1.0 + 0.22 * u_boost);

  // ══════════════════════════════════════════════════
  // 5. PURE NEON GREEN & WHITE CORE PIXEL PALETTE
  // ══════════════════════════════════════════════════
  vec4 color = vec4(0.0);

  if (total_heat >= 0.10 && total_heat < 0.22) {
    color = vec4(0.01, 0.10, 0.05, 0.88); // Deep pine border contour
  } else if (total_heat >= 0.22 && total_heat < 0.38) {
    color = vec4(0.02, 0.28, 0.14, 0.94); // Dark forest emerald
  } else if (total_heat >= 0.38 && total_heat < 0.54) {
    color = vec4(0.00, 0.68, 0.34, 1.0);  // Deep neon green
  } else if (total_heat >= 0.54 && total_heat < 0.72) {
    color = vec4(0.00, 1.00, 0.50, 1.0);  // Signature Neon Green (#00FF7F)
  } else if (total_heat >= 0.72 && total_heat < 0.86) {
    color = vec4(0.00, 1.00, 0.53, 1.0);  // Signature Neon Mint (#00FF88)
  } else if (total_heat >= 0.86 && total_heat < 0.95) {
    color = vec4(0.65, 1.00, 0.84, 1.0);  // High-contrast Cyber Mint highlight
  } else if (total_heat >= 0.95) {
    color = vec4(1.00, 1.00, 1.00, 1.0);  // Bright Incandescent White Core
  }

  gl_FragColor = color;
}
`;

const PIXEL_DIGITS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00110", "00001", "00001", "10001", "01110"],
  "4": ["10001", "10001", "10001", "11111", "00001", "00001", "00001"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "00100", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
};

function PixelDigitBadge({ value, size }: { value: number; size: "sm" | "md" | "lg" }) {
  const numStr = Math.max(0, Math.floor(value)).toString();
  const px = size === "lg" ? 3.4 : size === "sm" ? 2.0 : 2.6;
  const H = 7;
  const W_single = 5;
  const spacing = 1;
  const total_w = numStr.length * W_single + (numStr.length - 1) * spacing;

  const borderGrid: boolean[][] = Array.from({ length: H + 2 }, () =>
    Array(total_w + 2).fill(false)
  );
  const fillGrid: boolean[][] = Array.from({ length: H + 2 }, () =>
    Array(total_w + 2).fill(false)
  );

  for (let i = 0; i < numStr.length; i++) {
    const char = numStr[i];
    const grid = PIXEL_DIGITS[char] || PIXEL_DIGITS["0"];
    const colOffset = i * (W_single + spacing);

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W_single; c++) {
        if (grid[r][c] === "1") {
          fillGrid[r + 1][colOffset + c + 1] = true;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              borderGrid[r + 1 + dr][colOffset + c + 1 + dc] = true;
            }
          }
        }
      }
    }
  }

  const svgW = (total_w + 2) * px;
  const svgH = (H + 2) * px;

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < H + 2; r++) {
    for (let c = 0; c < total_w + 2; c++) {
      if (borderGrid[r][c] && !fillGrid[r][c]) {
        rects.push(
          <rect
            key={`b-${r}-${c}`}
            x={c * px}
            y={r * px}
            width={px}
            height={px}
            fill="#02160e"
          />
        );
      }
    }
  }

  for (let r = 0; r < H + 2; r++) {
    for (let c = 0; c < total_w + 2; c++) {
      if (fillGrid[r][c]) {
        rects.push(
          <rect
            key={`f-${r}-${c}`}
            x={c * px}
            y={r * px}
            width={px}
            height={px}
            fill="#ffffff"
          />
        );
      }
    }
  }

  return (
    <svg
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      shapeRendering="crispEdges"
      className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
    >
      {rects}
    </svg>
  );
}

export function PixelFlameStreak({
  streak,
  size = "md",
  interactive = true,
  className = "",
  manualTime,
}: PixelFlameStreakProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streakNumRef = useRef<HTMLDivElement | null>(null);
  const [isStoked, setIsStoked] = useState(false);
  const stokeRef = useRef<number>(0);
  const eruptBurstFiredRef = useRef<boolean>(false);

  const isStreak2 = streak === 2;

  const dimensions = {
    sm: { cssW: "w-20", cssH: "h-28", numSize: "text-lg", auraW: "w-24", auraH: "h-28" },
    md: { cssW: "w-24", cssH: "h-36", numSize: "text-2xl", auraW: "w-32", auraH: "h-36" },
    lg: { cssW: "w-32", cssH: "h-44", numSize: "text-3xl", auraW: "w-40", auraH: "h-44" },
  }[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    stokeRef.current = 1.0;
    setIsStoked(true);
    setTimeout(() => setIsStoked(false), 700);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fCanvas = flameCanvasRef.current;
    const pCanvas = particleCanvasRef.current;
    if (!canvas || !fCanvas || !pCanvas) return;

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

    const fCtx = fCanvas.getContext("2d");
    const pCtx = pCanvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || (size === "sm" ? 80 : size === "lg" ? 128 : 96);
    const cssH = rect.height || (size === "sm" ? 112 : size === "lg" ? 176 : 144);
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const W = Math.round(cssW * dpr);
    const H = Math.round(cssH * dpr);

    canvas.width = W;
    canvas.height = H;
    fCanvas.width = W;
    fCanvas.height = H;
    pCanvas.width = W;
    pCanvas.height = H;

    // Load living flame sprite (badge sprite for streak 2, blank sprite for other numbers)
    const flameImg = new Image();
    flameImg.src = isStreak2
      ? "/flame-stages/flame_badge_sprite.png"
      : "/flame-stages/flame_blank_sprite.png";

    // Aspect ratio fit calculations (sprite is 600x854, aspect ~0.7025)
    const targetAspect = 600 / 854;
    const containerAspect = W / H;
    let drawW = W;
    let drawH = H;
    let drawX = 0;
    let drawY = 0;

    if (containerAspect > targetAspect) {
      drawW = Math.round(H * targetAspect);
      drawX = Math.round((W - drawW) / 2);
    } else {
      drawH = Math.round(W / targetAspect);
      drawY = Math.round((H - drawH) / 2);
    }

    // Digit center position inside the teardrop white core (measured at 72.38% from sprite top)
    const digitTopPercent = ((drawY + drawH * 0.7238) / H) * 100;

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
          console.error("Shader compile error:", gl!.getShaderInfoLog(shader));
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
        const r = (14 + Math.random() * 18) * dpr;
        originX = W * 0.5 + Math.cos(ang) * r;
        originY = H * 0.60 + Math.sin(ang) * (r * 0.85);
        const tang = ang + Math.PI * 0.5;
        const speed = 0.6 + Math.random() * 0.8;
        vx = Math.cos(tang) * speed * dpr;
        vy = Math.sin(tang) * speed * 0.85 * dpr;
      } else if (t < 1.00) {
        // Phase 2: Charging - Accelerating inward spiral
        const ang = Math.random() * Math.PI * 2;
        const r = (12 + Math.random() * 22) * dpr;
        originX = W * 0.5 + Math.cos(ang) * r;
        originY = H * 0.60 + Math.sin(ang) * (r * 0.85);
        const tang = ang + Math.PI * 0.5;
        const speed = 1.2 + Math.random() * 1.4;
        vx = (Math.cos(tang) - Math.cos(ang) * 0.35) * speed * dpr;
        vy = (Math.sin(tang) - Math.sin(ang) * 0.35) * speed * 0.85 * dpr;
      } else if (t < 1.40 || isBurst) {
        // Phase 3: Eruption burst
        originX = W * 0.5 + (Math.random() - 0.5) * 20 * dpr;
        originY = H * 0.60 + (Math.random() - 0.5) * 16 * dpr;
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.5;
        const speed = (isBurst ? 1.8 : 1.4) + Math.random() * 1.8;
        vx = Math.cos(angle) * speed * dpr;
        vy = Math.sin(angle) * speed * dpr;
      } else {
        // Phase 5: Living flame steady rising embers
        originX = W * 0.5 + (Math.random() - 0.5) * (drawW * 0.65);
        originY = drawY + drawH * (0.60 - Math.random() * 0.50);
        const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.85;
        const speed = 0.6 + Math.random() * 1.2;
        vx = Math.cos(angle) * speed * dpr;
        vy = -Math.abs(Math.sin(angle)) * speed * 1.4 * dpr;
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
        size: Math.max(2, Math.round((1.2 + Math.random() * 1.5) * dpr)),
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

      // Update layers across animation phases
      if (flameCanvasRef.current && canvasRef.current) {
        if (effectiveTime < 1.00) {
          // Arcane energy orb (0.0s - 1.0s): Orb canvas fully active, flame canvas hidden
          canvasRef.current.style.opacity = "1";
          flameCanvasRef.current.style.opacity = "0";

          if (streakNumRef.current) {
            streakNumRef.current.style.top = "60%";
            if (effectiveTime < 0.25) {
              const fadeIn = Math.min(1.0, effectiveTime / 0.25);
              streakNumRef.current.style.opacity = fadeIn.toString();
              streakNumRef.current.style.transform = "translate(-50%, -50%) scale(0.92)";
            } else if (effectiveTime < 0.60) {
              streakNumRef.current.style.opacity = "1";
              streakNumRef.current.style.transform = "translate(-50%, -50%) scale(0.95)";
            } else {
              const chargeNorm = (effectiveTime - 0.60) / 0.40;
              const pulse = 0.95 + 0.05 * Math.sin(chargeNorm * Math.PI * 4);
              streakNumRef.current.style.opacity = "1";
              streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${pulse})`;
            }
          }
        } else if (effectiveTime < 1.50) {
          // Eruption phase (1.0s - 1.5s): Smooth crossfade & scale up
          const eruptNorm = (effectiveTime - 1.00) / 0.50;
          canvasRef.current.style.opacity = (1.0 - eruptNorm * 0.95).toString();
          flameCanvasRef.current.style.opacity = eruptNorm.toString();
          const scaleVal = 0.88 + 0.12 * eruptNorm;
          flameCanvasRef.current.style.transform = `scale(${scaleVal})`;

          if (streakNumRef.current) {
            if (isStreak2) {
              streakNumRef.current.style.opacity = (1.0 - eruptNorm).toString();
            } else {
              streakNumRef.current.style.top = `${digitTopPercent.toFixed(1)}%`;
              streakNumRef.current.style.opacity = "1";
              streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;
            }
          }
        } else {
          // Living flame phase (> 1.5s): Actively moving flame
          canvasRef.current.style.opacity = "0";
          flameCanvasRef.current.style.opacity = "1";

          const stokeScale = stokeRef.current > 0.01 ? 1.05 : 1.0;
          const flicker = (1.0 + 0.008 * Math.sin(effectiveTime * 6.5)) * stokeScale;
          flameCanvasRef.current.style.transform = `scale(${flicker})`;

          if (streakNumRef.current) {
            if (isStreak2) {
              streakNumRef.current.style.opacity = "0";
            } else {
              streakNumRef.current.style.top = `${digitTopPercent.toFixed(1)}%`;
              streakNumRef.current.style.opacity = "1";
              streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${flicker})`;
            }
          }
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

      // ── 1. RENDER WEBGL ARCANE ORB BODY (UNTOUCHED ORB PHASE) ──
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

      // ── 2. RENDER LIVING MOVING PIXEL FLAME (CANVAS 2D) ──
      if (fCtx && (flameImg.complete || flameImg.naturalWidth > 0)) {
        fCtx.imageSmoothingEnabled = false;
        fCtx.clearRect(0, 0, W, H);

        if (effectiveTime >= 0.95) {
          const imgW = flameImg.naturalWidth || 600;
          const imgH = flameImg.naturalHeight || 854;

          // Slicing: discrete chunky pixel strips
          const stripH = Math.max(2, Math.round(drawH / 44));
          const numStrips = Math.ceil(drawH / stripH);
          const stokeVal = stokeRef.current;

          for (let i = 0; i < numStrips; i++) {
            const dstStripY = drawY + i * stripH;
            const normY = 1.0 - (i * stripH + stripH * 0.5) / drawH;

            let shiftX = 0;
            let shiftY = 0;

            // Lower 48% is egg teardrop base, white core, and digit (ANCHORED & SOLID)
            if (normY > 0.46) {
              const tonguePower = Math.min(1.0, (normY - 0.46) / 0.46);
              const stokeMul = 1.0 + stokeVal * 0.9;

              // Convective sway
              const wave1 = Math.sin(effectiveTime * 3.8 + normY * 7.5) * 2.8;
              const wave2 = Math.sin(effectiveTime * 7.2 - normY * 11.0) * 1.3;
              const sway = (wave1 + wave2) * Math.pow(tonguePower, 1.3) * stokeMul * dpr;

              // Vertical lick & bob
              const lick1 = Math.sin(effectiveTime * 6.0 - normY * 8.5) * 1.8;
              const lick2 = Math.cos(effectiveTime * 3.4) * 0.7;
              const lick = (lick1 + lick2) * Math.pow(tonguePower, 1.5) * stokeMul * dpr;

              // Quantize to integer device pixels for chunky retro pixel stepping
              const pxStep = Math.max(1, Math.round(dpr));
              shiftX = Math.round(sway / pxStep) * pxStep;
              shiftY = Math.round(lick / pxStep) * pxStep;
            }

            const srcY = Math.round((i * stripH / drawH) * imgH);
            const srcStripH = Math.round(((stripH + 1) / drawH) * imgH);

            fCtx.drawImage(
              flameImg,
              0,
              Math.max(0, Math.min(imgH - 1, srcY)),
              imgW,
              Math.min(imgH - srcY, srcStripH),
              drawX + shiftX,
              dstStripY + shiftY,
              drawW,
              stripH + 1
            );
          }
        }
      }

      // ── 3. RENDER PIXEL EMBERS ON CANVAS 2D ──
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
  }, [dimensions, size, manualTime, isStreak2]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none group cursor-pointer ${className}`}
      onClick={handleStoke}
      title={interactive ? "Click or tap to stoke the roaring flame!" : undefined}
    >
      {/* Radiant Emerald Aura behind the Flame */}
      <div
        className={`absolute ${dimensions.auraW} ${dimensions.auraH} rounded-full bg-emerald-500/20 blur-2xl pointer-events-none transition-all duration-300 ${
          isStoked ? "scale-125 opacity-100 bg-emerald-400/30" : "scale-100 opacity-70"
        }`}
      />

      {/* Flame Container */}
      <div className={`relative ${dimensions.cssW} ${dimensions.cssH} flex items-center justify-center transition-transform duration-200 active:scale-95`}>
        {/* WebGL Arcane Energy Orb Canvas (Ignition & Charge) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-150 z-10"
        />

        {/* Living Moving Pixel Flame Canvas - Identical to pixel_flame_badge_2.jpg */}
        <canvas
          ref={flameCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-15"
          style={{
            imageRendering: "pixelated",
            opacity: manualTime !== undefined ? (manualTime >= 1.0 ? 1 : 0) : 0,
            transform: "scale(1.0)",
          }}
        />

        {/* Dynamic Embers Overlay Canvas */}
        <canvas
          ref={particleCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Crisp Streak Number Centered in the Flame Belly */}
        <div
          ref={streakNumRef}
          className="absolute top-[60%] left-1/2 pointer-events-none select-none flex flex-col items-center justify-center transition-transform duration-75 z-30"
          style={{
            opacity: manualTime !== undefined ? (isStreak2 && manualTime >= 1.0 ? 0 : 1) : 0,
            transform: "translate(-50%, -50%) scale(0.95)",
          }}
        >
          <PixelDigitBadge value={streak} size={size} />
        </div>
      </div>

      {/* Pill Badge */}
      <div className="mt-[-2px] z-10 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-[9px] font-mono font-bold tracking-widest uppercase text-emerald-300 shadow-[0_0_12px_rgba(34,197,94,0.3)] flex items-center gap-1.5 backdrop-blur-xs">
        <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-full" />
        {streak === 1 ? "DAY STREAK" : "DAYS BURNING"}
      </div>
    </div>
  );
}
