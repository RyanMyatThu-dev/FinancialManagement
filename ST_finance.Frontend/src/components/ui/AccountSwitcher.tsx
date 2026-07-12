"use client";

import { ChevronDown } from "lucide-react";

interface AccountSwitcherProps {
  accountName?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

export function AccountSwitcher({
  accountName = "Main Account",
  badge = "CU",
  badgeColor = "bg-[hsl(var(--chula-pink))]",
  onClick,
}: AccountSwitcherProps) {
  return (
    <button
      id="account-switcher"
      onClick={onClick}
      className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))] hover:border-[hsl(var(--primary)/0.4)] transition-all duration-200"
    >
      <div
        className={`w-5 h-5 flex items-center justify-center ${badgeColor} rounded-full text-[9px] text-white font-black shrink-0`}
      >
        {badge}
      </div>
      <span className="text-xs font-medium text-[hsl(var(--foreground))]">{accountName}</span>
      <ChevronDown className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
    </button>
  );
}
