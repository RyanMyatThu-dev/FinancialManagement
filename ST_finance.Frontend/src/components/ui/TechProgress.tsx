interface TechProgressProps {
  value: number;       // percentage 0–100
  label?: string;
  minVal?: string;
  maxVal?: string;
  color?: "primary" | "safe" | "warning" | "destructive";
  className?: string;
}

export function TechProgress({
  value,
  label,
  minVal,
  maxVal,
  color = "primary",
  className = "",
}: TechProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const fillColors: Record<string, string> = {
    primary:     "bg-[hsl(var(--primary))]",
    safe:        "bg-[hsl(var(--safe-to-spend))]",
    warning:     "bg-[hsl(var(--warning))]",
    destructive: "bg-[hsl(var(--destructive))]",
  };

  const pointerColors: Record<string, string> = {
    primary:     "border-b-[hsl(var(--primary))]",
    safe:        "border-b-[hsl(var(--safe-to-spend))]",
    warning:     "border-b-[hsl(var(--warning))]",
    destructive: "border-b-[hsl(var(--destructive))]",
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{label}</span>
          <span className="text-xs font-mono font-bold text-[hsl(var(--foreground))]">
            {clampedValue.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Thick Progress Track */}
      <div className="relative h-3 w-full bg-[hsl(var(--secondary))] rounded-full overflow-visible">
        {/* Fill Bar */}
        <div
          className={`h-full ${fillColors[color]} rounded-full transition-all duration-500`}
          style={{ width: `${clampedValue}%` }}
        />

        {/* Indicator Triangle Underneath */}
        <div
          className={`absolute -bottom-2.5 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent ${pointerColors[color]} transition-all duration-500`}
          style={{ left: `calc(${clampedValue}% - 5px)` }}
        />
      </div>

      {/* Min / Max Labels */}
      {(minVal || maxVal) && (
        <div className="flex justify-between items-center pt-1">
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{minVal}</span>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{maxVal}</span>
        </div>
      )}
    </div>
  );
}
