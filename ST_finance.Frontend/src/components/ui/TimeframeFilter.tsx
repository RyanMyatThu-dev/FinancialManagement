"use client";

import { useState } from "react";

export type Timeframe = "Day" | "Week" | "Month" | "Year" | "Custom";

interface TimeframeFilterProps {
  value?: Timeframe;
  onChange?: (tf: Timeframe) => void;
}

const OPTIONS: Timeframe[] = ["Day", "Week", "Month", "Year", "Custom"];

export function TimeframeFilter({ value = "Month", onChange }: TimeframeFilterProps) {
  const active = value;

  const handleClick = (tf: Timeframe) => {
    onChange?.(tf);
  };

  return (
    <div
      id="timeframe-filter"
      className="inline-flex items-center gap-1.5 p-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
    >
      {OPTIONS.map((tf) => (
        <button
          key={tf}
          onClick={() => handleClick(tf)}
          className={`ds-segment-pill ${active === tf ? "ds-segment-pill-active" : ""}`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
