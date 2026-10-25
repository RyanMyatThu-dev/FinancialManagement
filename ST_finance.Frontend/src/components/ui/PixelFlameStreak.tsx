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
  // Quantize coordinates to discrete pixel art grid (~42x60 for sharp retro pixel steps)
  vec2 pixelGrid = vec2(42.0, 60.0);
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
  // 1. SPHERICAL ARCANE ENERGY ORB (Ignition & Charge - UNTOUCHED)
  // ══════════════════════════════════════════════════
  vec2 p_orb = vec2((uv.x - 0.5) * aspect, uv.y - 0.40);
  float r_orb = length(p_orb);
  float ang_orb = atan(p_orb.y, p_orb.x);

  float R_base = 0.138;
  float growth = mix(0.42, 1.0, smoothstep(0.0, 0.55, t_windup));
  float compression = 1.0 - 0.09 * sin(t_charge * 3.14159265);
  float R_curr = R_base * growth * compression;

  float r_norm = r_orb / max(0.001, R_curr);
  float z_sph = sqrt(max(0.0, 1.0 - min(1.0, r_norm * r_norm)));

  float turb_speed = 3.6 + 4.5 * t_charge;
  float orb_turb = 0.10 * noise(vec2(cos(ang_orb) * 3.5 + t * turb_speed, sin(ang_orb) * 3.5 - t * turb_speed))
                 + 0.06 * fbm(vec2(p_orb.x * 24.0, p_orb.y * 24.0 - t * 4.0));
  float orb_edge = smoothstep(1.10 + orb_turb, 0.80 + orb_turb, r_norm);

  float core_pulse = 0.07 * sin(t * (7.0 + 13.0 * t_charge));
  float core_r = (0.50 - 0.16 * t_charge) + core_pulse;
  float core_base = smoothstep(core_r, 0.0, r_norm);
  float flash = smoothstep(0.85, 0.98, t_charge) * (1.0 - t_erupt) * 0.45;
  float core_heat = core_base + flash * smoothstep(core_r * 1.35, 0.0, r_norm);

  float arc_rot = t * (4.2 + 5.5 * t_charge);

  // Arc 1 (Tilted +32 degrees)
  mat2 rot1 = mat2(0.848, -0.530, 0.530, 0.848);
  vec2 p_arc1 = rot1 * p_orb;
  p_arc1.y *= 1.85;
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

  float wisp_inward = 14.0 * t_charge;
  float wisp1 = sin(ang_orb * 3.0 + r_orb * 32.0 - t * 7.5 - wisp_inward);
  float wisp2 = cos(ang_orb * 4.0 - r_orb * 24.0 + t * 9.5);
  float wisp_zone = smoothstep(R_curr * 1.70, R_curr * 0.85, r_orb) * smoothstep(R_curr * 0.35, R_curr * 0.75, r_orb);
  float wisps = max(0.0, wisp1 * 0.5 + wisp2 * 0.5) * wisp_zone * 0.48;

  float dot_sparks = step(0.93, sin(ang_orb * 6.0 - arc_rot * 2.0) * sin(r_orb * 42.0 + t * 6.0))
                   * smoothstep(R_curr * 1.45, R_curr * 0.65, r_orb) * 0.45;

  float orb_envelope = smoothstep(R_curr * 1.82, R_curr * 1.55, r_orb);
  float orb_body = orb_edge * (0.42 + 0.36 * z_sph + 0.16 * orb_turb);
  float orb_total_heat = (orb_body + core_heat * 0.68 + (arc1 + arc2 + arc3 + wisps + dot_sparks) * (1.0 - m * 0.85)) * orb_envelope;

  // ══════════════════════════════════════════════════
  // 2. PROCEDURAL MULTI-TONGUE FLAME (MATCHING AxUEj.jpg)
  // ══════════════════════════════════════════════════
  float y_base = mix(0.38, 0.14, m);
  float dy = (y - y_base) / 0.78;

  float flow_y = dy * 4.2 - t * 4.8;
  float body_sprout = smoothstep(0.02, 0.70, m);
  float branch_sprout = smoothstep(0.10, 0.88, m);

  // A. Sharp V-Hearth Bottom (angles up from central point x=0, dy=0)
  float v_bottom = 0.52 * abs(x);
  float in_v = step(v_bottom - 0.012, dy);

  // B. Full Connected Flame Body (fuller belly width to 0.46)
  float dy_mid = dy - 0.30;
  float w_belly = 0.46 * sqrt(max(0.0, 1.0 - min(1.0, pow(abs(dy_mid) / 0.28, 1.8))));
  if (dy > 0.46) {
    w_belly = 0.46 * max(0.0, 1.0 - (dy - 0.46) / 0.42);
  }
  float env_belly = smoothstep(1.0, 0.15, abs(x) / max(0.008, w_belly)) * step(0.0, dy) * step(dy, 0.46) * body_sprout;

  // C. Distinct Flame Tongues
  // Center Spire: tip lowered to 0.92, thicker width 0.26, pow falloff 0.72
  float tip_C = 0.92 + 0.035 * sin(t * 3.4) + 0.05 * u_boost;
  float p_C = clamp((dy - 0.18) / max(0.01, tip_C - 0.18), 0.0, 1.0);
  float sway_C = (-0.026 * sin(p_C * 2.6) + 0.020 * sin(t * 2.8 + p_C * 3.8) + 0.010 * sin(p_C * 6.5 - t * 4.5)) * pow(p_C, 1.1);
  float w_C = 0.26 * pow(1.0 - p_C, 0.72) * (0.86 + 0.32 * sin(p_C * 3.14159));
  float env_C = smoothstep(1.0, 0.15, abs(x - sway_C) / max(0.006, w_C)) * step(0.16, dy) * step(dy, tip_C) * branch_sprout;

  // Inner Left Tongue (L1): Lowered to 0.72, fuller (0.175), sway base -0.07
  float tip_L1 = 0.72 + 0.030 * sin(t * 3.8 + 1.2);
  float p_L1 = clamp((dy - 0.16) / max(0.01, tip_L1 - 0.16), 0.0, 1.0);
  float sway_L1 = -0.07 - 0.13 * sin(p_L1 * 1.5) + 0.016 * sin(t * 3.2 + p_L1 * 3.5);
  float w_L1 = 0.175 * pow(1.0 - p_L1, 0.68) * (0.86 + 0.28 * sin(p_L1 * 3.14159));
  float env_L1 = smoothstep(1.0, 0.15, abs(x - sway_L1) / max(0.006, w_L1)) * step(0.16, dy) * step(dy, tip_L1) * branch_sprout;

  // Inner Right Tongue (R1): Lowered to 0.72, fuller (0.175), sway base +0.07
  float tip_R1 = 0.72 + 0.030 * sin(t * 3.6 + 2.3);
  float p_R1 = clamp((dy - 0.16) / max(0.01, tip_R1 - 0.16), 0.0, 1.0);
  float sway_R1 = 0.07 + 0.13 * sin(p_R1 * 1.5) - 0.016 * sin(t * 3.0 + p_R1 * 3.5);
  float w_R1 = 0.175 * pow(1.0 - p_R1, 0.68) * (0.86 + 0.28 * sin(p_R1 * 3.14159));
  float env_R1 = smoothstep(1.0, 0.15, abs(x - sway_R1) / max(0.006, w_R1)) * step(0.16, dy) * step(dy, tip_R1) * branch_sprout;

  // Outer Left Tongue (L2): Lowered to 0.48, closer (-0.13), width 0.13
  float tip_L2 = 0.48 + 0.022 * sin(t * 4.2 + 0.7);
  float p_L2 = clamp((dy - 0.12) / max(0.01, tip_L2 - 0.12), 0.0, 1.0);
  float sway_L2 = -0.13 - 0.13 * sin(p_L2 * 1.4);
  float w_L2 = 0.13 * pow(1.0 - p_L2, 0.65) * (0.85 + 0.25 * sin(p_L2 * 3.14159));
  float env_L2 = smoothstep(1.0, 0.15, abs(x - sway_L2) / max(0.006, w_L2)) * step(0.12, dy) * step(dy, tip_L2) * branch_sprout;

  // Outer Right Tongue (R2): Lowered to 0.48, closer (+0.13), width 0.13
  float tip_R2 = 0.48 + 0.022 * sin(t * 4.0 + 2.1);
  float p_R2 = clamp((dy - 0.12) / max(0.01, tip_R2 - 0.12), 0.0, 1.0);
  float sway_R2 = 0.13 + 0.13 * sin(p_R2 * 1.4);
  float w_R2 = 0.13 * pow(1.0 - p_R2, 0.65) * (0.85 + 0.25 * sin(p_R2 * 3.14159));
  float env_R2 = smoothstep(1.0, 0.15, abs(x - sway_R2) / max(0.006, w_R2)) * step(0.12, dy) * step(dy, tip_R2) * branch_sprout;

  // Left & Right Flank Teeth (L3, R3): Lowered to 0.34, closer (+-0.19), width 0.09
  float tip_L3 = 0.34 + 0.018 * sin(t * 4.6 + 1.8);
  float p_L3 = clamp((dy - 0.10) / max(0.01, tip_L3 - 0.10), 0.0, 1.0);
  float sway_L3 = -0.19 - 0.08 * sin(p_L3 * 1.2);
  float w_L3 = 0.09 * (1.0 - p_L3);
  float env_L3 = smoothstep(1.0, 0.15, abs(x - sway_L3) / max(0.006, w_L3)) * step(0.10, dy) * step(dy, tip_L3) * branch_sprout;

  float tip_R3 = 0.34 + 0.018 * sin(t * 4.4 + 3.1);
  float p_R3 = clamp((dy - 0.10) / max(0.01, tip_R3 - 0.10), 0.0, 1.0);
  float sway_R3 = 0.19 + 0.08 * sin(p_R3 * 1.2);
  float w_R3 = 0.09 * (1.0 - p_R3);
  float env_R3 = smoothstep(1.0, 0.15, abs(x - sway_R3) / max(0.006, w_R3)) * step(0.10, dy) * step(dy, tip_R3) * branch_sprout;

  // Full connected body mass
  float body_mass = max(env_belly * 0.96, max(env_C, max(env_L1, max(env_R1, max(env_L2, max(env_R2, max(env_L3, env_R3)))))));

  // Clefts: Deepened main clefts between center and L1/R1 for clear tongue separation
  float cleft_CL = clamp(1.0 - abs(x - (sway_C + sway_L1) * 0.5) / 0.030, 0.0, 1.0) * step(0.40, dy) * step(dy, min(tip_C, tip_L1));
  float cleft_CR = clamp(1.0 - abs(x - (sway_C + sway_R1) * 0.5) / 0.030, 0.0, 1.0) * step(0.40, dy) * step(dy, min(tip_C, tip_R1));
  float cleft_LL2 = clamp(1.0 - abs(x - (sway_L1 + sway_L2) * 0.5) / 0.024, 0.0, 1.0) * step(0.32, dy) * step(dy, min(tip_L1, tip_L2));
  float cleft_RR2 = clamp(1.0 - abs(x - (sway_R1 + sway_R2) * 0.5) / 0.024, 0.0, 1.0) * step(0.32, dy) * step(dy, min(tip_R1, tip_R2));
  float cleft_LL3 = clamp(1.0 - abs(x - (sway_L2 + sway_L3) * 0.5) / 0.020, 0.0, 1.0) * step(0.24, dy) * step(dy, min(tip_L2, tip_L3));
  float cleft_RR3 = clamp(1.0 - abs(x - (sway_R2 + sway_R3) * 0.5) / 0.020, 0.0, 1.0) * step(0.24, dy) * step(dy, min(tip_R2, tip_R3));

  float cleft_max = max(cleft_CL, max(cleft_CR, max(cleft_LL2, max(cleft_RR2, max(cleft_LL3, cleft_RR3)))));
  float flame_silhouette = clamp(body_mass - 0.55 * branch_sprout * cleft_max, 0.0, 1.0) * in_v;

  // Core: Soft diamond / V-core centered slightly higher at dy ~ 0.20
  float dy_core = dy - 0.20;
  float core_w = 0.18 * sqrt(max(0.0, 1.0 - min(1.0, pow(abs(dy_core) / 0.20, 1.8))));
  float core_v = smoothstep(1.0, 0.15, abs(x) / max(0.005, core_w)) * step(-0.16, dy_core) * step(dy_core, 0.20);

  // Tongue Spines: Luminous channels running up C, L1, R1
  float spine_C = smoothstep(w_C * 0.40, 0.0, abs(x - sway_C)) * step(0.18, dy) * step(dy, tip_C - 0.08);
  float spine_L1 = smoothstep(w_L1 * 0.40, 0.0, abs(x - sway_L1)) * step(0.16, dy) * step(dy, tip_L1 - 0.08);
  float spine_R1 = smoothstep(w_R1 * 0.40, 0.0, abs(x - sway_R1)) * step(0.16, dy) * step(dy, tip_R1 - 0.08);
  float spines = spine_C * 0.28 + spine_L1 * 0.20 + spine_R1 * 0.20;

  float edge_dist = smoothstep(0.04, 0.28, flame_silhouette);
  float body_heat = 0.32 + 0.46 * edge_dist;
  float filaments = 0.06 * sin(x * 32.0 + sin(flow_y * 2.0));

  float flame_heat = (body_heat + core_v * 0.65 + spines + filaments) * flame_silhouette;

  // Floating detached sparks
  float spark_hash = sin(dot(uv * pixelGrid, vec2(127.1, 311.7)) + t * 4.5) * 43758.5453;
  float spark_val = fract(spark_hash);
  if (spark_val > 0.962 && dy > 0.40 && dy < 0.98 && abs(x) < 0.44 && flame_silhouette < 0.06) {
    flame_heat += 0.85;
  }

  // ══════════════════════════════════════════════════
  // 3. CONTINUOUS SPHERICAL ERUPTION MORPHING
  // ══════════════════════════════════════════════════
  float total_heat = mix(orb_total_heat, flame_heat, m);

  float erupt_burst = sin(m * 3.14159265);
  if (erupt_burst > 0.01 && y > 0.38 && y < 0.85) {
    float flame_env_x = smoothstep(0.32 * (1.0 - (y - 0.38) * 1.2), 0.0, abs(x));
    float tear_wisps = 0.30 * erupt_burst * flame_env_x * fbm(vec2(x * 14.0, (y - 0.40) * 12.0 - t * 8.0));
    total_heat += tear_wisps * smoothstep(0.38, 0.55, y);
  }

  float active_envelope = max(orb_envelope * (1.0 - m * 0.9), flame_silhouette);
  total_heat *= smoothstep(0.01, 0.06, active_envelope);

  if (total_heat < 0.10) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  total_heat *= (1.0 + 0.22 * u_boost);

  // ══════════════════════════════════════════════════
  // 4. PURE NEON GREEN & WHITE CORE PIXEL PALETTE (AxUEj.jpg)
  // ══════════════════════════════════════════════════
  vec4 color = vec4(0.0);

  if (total_heat >= 0.10 && total_heat < 0.26) {
    color = vec4(0.01, 0.11, 0.06, 0.92); // Deep pine border contour
  } else if (total_heat >= 0.26 && total_heat < 0.44) {
    color = vec4(0.02, 0.27, 0.14, 0.96); // Dark forest emerald
  } else if (total_heat >= 0.44 && total_heat < 0.62) {
    color = vec4(0.00, 0.68, 0.34, 1.0);  // Deep neon green
  } else if (total_heat >= 0.62 && total_heat < 0.78) {
    color = vec4(0.00, 1.00, 0.50, 1.0);  // Signature Neon Green (#00FF7F)
  } else if (total_heat >= 0.78 && total_heat < 0.88) {
    color = vec4(0.00, 1.00, 0.56, 1.0);  // Signature Neon Mint (#00FF88)
  } else if (total_heat >= 0.88 && total_heat < 0.96) {
    color = vec4(0.66, 1.00, 0.86, 1.0);  // High-contrast Cyber Mint highlight
  } else if (total_heat >= 0.96) {
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

const DIMENSIONS_MAP = {
  sm: { cssW: "w-20", cssH: "h-28", numSize: "text-lg", auraW: "w-24", auraH: "h-28" },
  md: { cssW: "w-24", cssH: "h-36", numSize: "text-2xl", auraW: "w-32", auraH: "h-36" },
  lg: { cssW: "w-32", cssH: "h-44", numSize: "text-3xl", auraW: "w-40", auraH: "h-44" },
} as const;

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
  const startTimeRef = useRef<number>(0);
  const particlesRef = useRef<EmberParticle[]>([]);
  const stokeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dimensions = DIMENSIONS_MAP[size];

  const handleStoke = useCallback(() => {
    if (!interactive) return;
    // Cleanly restart the animation from Phase 1 without reinitializing the WebGL context
    startTimeRef.current = performance.now();
    eruptBurstFiredRef.current = false;
    particlesRef.current.length = 0;
    stokeRef.current = 1.0;

    setIsStoked(true);
    if (stokeTimeoutRef.current) {
      clearTimeout(stokeTimeoutRef.current);
    }
    stokeTimeoutRef.current = setTimeout(() => {
      setIsStoked(false);
    }, 700);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pCanvas = particleCanvasRef.current;
    if (!canvas || !pCanvas) return;

    startTimeRef.current = performance.now();
    eruptBurstFiredRef.current = false;
    particlesRef.current.length = 0;

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
    const cssW = rect.width || (size === "sm" ? 80 : size === "lg" ? 128 : 96);
    const cssH = rect.height || (size === "sm" ? 112 : size === "lg" ? 176 : 144);
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
    const particles = particlesRef.current;
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
        originX = W * 0.5 + (Math.random() - 0.5) * 44 * dpr;
        originY = H * (0.65 - Math.random() * 0.45);
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

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);

      const elapsedSec =
        manualTime !== undefined ? manualTime : (now - startTimeRef.current) * 0.001;
      const effectiveTime = prefersReducedMotion ? elapsedSec * 0.4 : elapsedSec;

      // Update streak number position and animation
      if (streakNumRef.current) {
        if (effectiveTime < 1.00) {
          streakNumRef.current.style.top = "60%";
        } else if (effectiveTime < 1.50) {
          const eruptNorm = (effectiveTime - 1.00) / 0.50;
          const smooth = 0.5 - 0.5 * Math.cos(eruptNorm * Math.PI);
          streakNumRef.current.style.top = `${60 + 9 * smooth}%`;
        } else {
          streakNumRef.current.style.top = "69%";
        }
        if (effectiveTime < 0.25) {
          const fadeIn = Math.min(1.0, effectiveTime / 0.25);
          streakNumRef.current.style.opacity = fadeIn.toString();
          streakNumRef.current.style.transform = "translate(-50%, -50%) scale(0.92)";
        } else if (effectiveTime < 0.60) {
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = "translate(-50%, -50%) scale(0.95)";
        } else if (effectiveTime < 1.00) {
          const chargeNorm = (effectiveTime - 0.60) / 0.40;
          const pulse = 0.95 + 0.05 * Math.sin(chargeNorm * Math.PI * 4);
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${pulse})`;
        } else if (effectiveTime < 1.50) {
          const eruptNorm = (effectiveTime - 1.00) / 0.50;
          const scaleVal = 0.95 + 0.08 * eruptNorm;
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${scaleVal})`;
        } else {
          const stokeScale = stokeRef.current > 0.01 ? 1.05 : 1.0;
          const flicker = (1.0 + 0.010 * Math.sin(effectiveTime * 7.0)) * stokeScale;
          streakNumRef.current.style.opacity = "1";
          streakNumRef.current.style.transform = `translate(-50%, -50%) scale(${flicker})`;
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

      // ── 1. RENDER WEBGL ARCANE ORB & PROCEDURAL MULTI-TONGUE FLAME ──
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
      if (stokeTimeoutRef.current) {
        clearTimeout(stokeTimeoutRef.current);
      }
      if (gl) {
        if (program) gl.deleteProgram(program);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
      }
    };
  }, [size, manualTime]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none group cursor-pointer ${className}`}
      onClick={handleStoke}
      title={interactive ? "Click or tap to restart flame animation!" : undefined}
    >
      {/* Radiant Emerald Aura behind the Flame */}
      <div
        className={`absolute ${dimensions.auraW} ${dimensions.auraH} rounded-full bg-emerald-500/20 blur-2xl pointer-events-none transition-all duration-300 ${
          isStoked ? "scale-125 opacity-100 bg-emerald-400/30" : "scale-100 opacity-70"
        }`}
      />

      {/* Flame Container */}
      <div className={`relative ${dimensions.cssW} ${dimensions.cssH} flex items-center justify-center transition-transform duration-200 active:scale-95`}>
        {/* WebGL Arcane Energy Orb & Procedural Pixel Flame (100% Procedural GPU Shader) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
        />

        {/* Dynamic Embers Overlay Canvas */}
        <canvas
          ref={particleCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Crisp Streak Number Centered in the Flame Core */}
        <div
          ref={streakNumRef}
          className="absolute top-[69%] left-1/2 pointer-events-none select-none flex flex-col items-center justify-center transition-transform duration-75 z-30"
          style={{
            opacity: manualTime !== undefined ? 1 : 0,
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
