interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  positiveColor?: boolean;
  negativeColor?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = "THB",
  size = "md",
  className = "",
  positiveColor = false,
  negativeColor = false,
}: CurrencyDisplayProps) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const parts = formatted.split(".");
  const cents = parts[1] || "00";
  const integerStr = parts[0]; // e.g. "60,312" or "312"

  // Split into major (first group) and minor (subsequent comma groups)
  const match = integerStr.match(/^([0-9]+)((?:,[0-9]+)+)$/);

  const sizeMap = {
    sm: { major: "text-lg",  minor: "text-sm",   cents: "text-[10px]" },
    md: { major: "text-2xl", minor: "text-base",  cents: "text-xs"    },
    lg: { major: "text-4xl", minor: "text-xl",    cents: "text-sm"    },
  };

  const colorClass = positiveColor
    ? "text-[hsl(var(--primary))]"
    : negativeColor
    ? "text-[hsl(var(--destructive))]"
    : "";

  return (
    <span
      className={`font-mono inline-flex items-baseline gap-0.5 tabular-nums ${colorClass} ${className}`}
    >
      {isNegative && (
        <span className={`${sizeMap[size].major} font-bold`}>-</span>
      )}
      {match ? (
        <>
          <span className={`${sizeMap[size].major} font-bold`}>{match[1]}</span>
          <span className={`${sizeMap[size].minor} font-semibold opacity-70`}>{match[2]}</span>
        </>
      ) : (
        <span className={`${sizeMap[size].major} font-bold`}>{integerStr}</span>
      )}
      <span className={`${sizeMap[size].cents} font-medium opacity-60 ml-0.5`}>.{cents}</span>
      <span className={`${sizeMap[size].cents} font-semibold opacity-50 ml-1`}>{currency}</span>
    </span>
  );
}

export const formatCurrency = (amount: number, currency: string = "THB") => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const prefix = isNegative ? "-" : "";

  if (currency === "MMK") {
    return `${prefix}${formatted} MMK`;
  }
  if (currency === "THB") {
    return `${prefix}฿${formatted}`;
  }
  if (currency === "USD") {
    return `${prefix}$${formatted}`;
  }
  if (currency === "EUR") {
    return `${prefix}€${formatted}`;
  }
  if (currency === "GBP") {
    return `${prefix}£${formatted}`;
  }
  if (currency === "SGD") {
    return `${prefix}S$${formatted}`;
  }
  return `${prefix}${formatted} ${currency}`;
};
