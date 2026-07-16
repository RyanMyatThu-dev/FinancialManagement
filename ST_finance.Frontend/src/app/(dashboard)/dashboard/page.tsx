"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { TechProgress } from "@/components/ui/TechProgress";
import { TimeframeFilter, type Timeframe } from "@/components/ui/TimeframeFilter";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  Calendar,
  UtensilsCrossed,
  CheckCircle,
  PiggyBank,
  Wallet,
  Info,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DashboardSummary {
  quota: number;
  canteenIndex: number;
  totalBalance: number;
  totalSavings: number;
  disposableBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  spentToday: number;
  activeWarnings: string[];
  resetDayText: string;
  enableQuotaPacing: boolean;
}

interface QuotaTrendItem {
  date: string;
  targetQuota: number;
  actualSpent: number;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("Month");

  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<DashboardSummary>({
    queryKey: ["dashboardSummary", timeframe],
    queryFn: async () => {
      const res = await apiClient.get(`/api/dashboard/summary?timeframe=${timeframe}`);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch dashboard summary");
    },
  });

  const { data: trends, isLoading: isTrendsLoading } = useQuery<QuotaTrendItem[]>({
    queryKey: ["dashboardTrends"],
    queryFn: async () => {
      const res = await apiClient.get("/api/dashboard/trends");
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch trends");
    },
  });

  const isLoading = isSummaryLoading || isTrendsLoading;
  const currency  = user?.currency || "THB";

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))] mx-auto" />
          <p className="text-[hsl(var(--muted-foreground))] text-xs font-mono uppercase tracking-widest">
            Retrieving ledger data...
          </p>
        </div>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="ds-card ds-alert-error p-6 text-center max-w-md mx-auto mt-12">
        <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
        <h3 className="text-sm font-bold uppercase tracking-wider">Dashboard Error</h3>
        <p className="text-xs mt-2 font-mono opacity-80">{(summaryError as Error).message}</p>
      </div>
    );
  }

  const hints = summary?.activeWarnings?.filter(w => w.startsWith("Pacing-Hint:")) || [];
  const warnings = summary?.activeWarnings?.filter(w => !w.startsWith("Pacing-Hint:")) || [];

  const chartData = (trends || []).map((item) => {
    const parts = String(item.date).split("-");
    const formattedDate = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleDateString(undefined, {
          month: "short",
          day:   "numeric",
        })
      : String(item.date);
    return {
      ...item,
      formattedDate,
    };
  });

  // Calculate quota usage % (example: spent vs quota)
  const quotaUsedPercent =
    summary && summary.quota > 0
      ? Math.min(100, (summary.spentToday / summary.quota) * 100)
      : 0;

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ────────────────────────────────────────────── */}
      <div className="ds-card p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        {/* Left: greeting */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
            <Zap className="h-3 w-3 text-[hsl(var(--primary))]" />
            Core Analytics
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Hello, {user?.fullName || "Student"} 👋
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm max-w-lg">
            Real-time daily quota tracking, automated billing, and savings allocations.
          </p>
        </div>

        {/* Right: disposable pool + timeframe */}
        <div className="flex flex-col lg:items-end items-start gap-4 shrink-0">
          <TimeframeFilter value={timeframe} onChange={setTimeframe} />
          <div className="lg:text-right text-left">
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono font-bold uppercase tracking-widest mb-1.5">
              Disposable Pool
            </p>
            <CurrencyDisplay
              amount={summary?.disposableBalance ?? 0}
              currency={currency}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <Link href="/accounts" className="ds-card ds-card-interactive p-5 block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Net Balance
            </span>
            <div className="ds-btn-icon h-8 w-8">
              <Wallet className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            </div>
          </div>
          <CurrencyDisplay amount={summary?.totalBalance ?? 0} currency={currency} size="md" />
        </Link>

        {/* Earmarked Savings */}
        <Link href="/savings" className="ds-card ds-card-interactive p-5 block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Earmarked Savings
            </span>
            <div className="ds-btn-icon h-8 w-8">
              <PiggyBank className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            </div>
          </div>
          <CurrencyDisplay amount={summary?.totalSavings ?? 0} currency={currency} size="md" />
        </Link>

        {/* Inflow Card */}
        <Link href="/transactions" className="ds-card ds-card-interactive p-5 block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              {timeframe === "Day" ? "Daily" : timeframe === "Week" ? "Weekly" : timeframe === "Month" ? "Monthly" : "Yearly"} Inflow
            </span>
            <div className="ds-btn-icon h-8 w-8">
              <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
            </div>
          </div>
          <CurrencyDisplay
            amount={summary?.monthlyIncome ?? 0}
            currency={currency}
            size="md"
            positiveColor
          />
        </Link>

        {/* Outflow Card */}
        <Link href="/transactions" className="ds-card ds-card-interactive p-5 block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              {timeframe === "Day" ? "Daily" : timeframe === "Week" ? "Weekly" : timeframe === "Month" ? "Monthly" : "Yearly"} Outflow
            </span>
            <div className="ds-btn-icon h-8 w-8">
              <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
            </div>
          </div>
          <CurrencyDisplay
            amount={summary?.monthlyExpense ?? 0}
            currency={currency}
            size="md"
            negativeColor
          />
        </Link>
      </div>

      {/* ── Primary KPI: Quota + Warnings ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {summary && !summary.enableQuotaPacing ? (
          <div className="lg:col-span-2 ds-card p-6 flex flex-col items-center justify-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--secondary)/0.5)] flex items-center justify-center text-[hsl(var(--muted-foreground))]">
              <Calendar className="h-6 w-6 text-[hsl(var(--primary))]" />
            </div>
            <h3 className="text-sm font-bold">Daily Quota Pacing is Disabled</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm leading-relaxed">
              You can turn on daily quota pacing in your account profile settings to track your safe-to-spend allowance relative to your recurring inflows.
            </p>
          </div>
        ) : (
          /* Safe-To-Spend Quota Gauge */
          <div className="lg:col-span-2 ds-card p-6 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {summary && summary.spentToday > summary.quota ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[9px] font-bold text-[hsl(var(--destructive))] uppercase tracking-widest">
                        Exceeded By
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.25)]">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Over Budget
                      </span>
                    </div>
                    <CurrencyDisplay
                      amount={summary.spentToday - summary.quota}
                      currency={currency}
                      size="lg"
                      negativeColor
                    />
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-1">
                      Quota was ฿{summary.quota.toFixed(2)} — spent ฿{summary.spentToday.toFixed(2)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                      Daily Spending Allowance (Quota)
                    </p>
                    <CurrencyDisplay
                      amount={summary?.quota ?? 0}
                      currency={currency}
                      size="lg"
                    />
                  </>
                )}
              </div>
              {/* Canteen Index */}
              <div className="ds-card p-3.5 text-center">
                <div className="flex items-center gap-1.5 justify-center text-[hsl(var(--foreground))]">
                  <UtensilsCrossed className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <span className="text-lg font-extrabold font-mono">{summary?.canteenIndex ?? 0}</span>
                </div>
                <p className="text-[8px] uppercase font-bold tracking-wider text-[hsl(var(--muted-foreground))] mt-0.5">
                  Meal Units
                </p>
              </div>
            </div>

            {/* Progress Widget */}
            <TechProgress
              value={quotaUsedPercent}
              label={summary && summary.spentToday > (summary.quota || 0) ? "⚠ Spending Exceeded Quota" : "Today's Spending vs. Quota"}
              minVal="฿0"
              maxVal={`฿${summary?.quota?.toFixed(0) ?? "—"}`}
              color={quotaUsedPercent > 80 ? "destructive" : quotaUsedPercent > 60 ? "warning" : "primary"}
            />

            {/* Quota Formula Explanation Footer */}
            <div className="bg-[hsl(var(--secondary)/0.2)] p-3 rounded-lg border border-[hsl(var(--border))] text-[10px] font-mono leading-normal text-[hsl(var(--muted-foreground))] flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-[hsl(var(--primary))] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[hsl(var(--foreground))] block">📐 Safe-to-Spend Quota Formula</span>
                <p>
                  Quota = (Disposable Pool - Upcoming Bills - Active Goal Needs) / Days Remaining
                </p>
                <p className="text-[9px] opacity-75">
                  Protects your upcoming bills and active savings goals automatically over the remaining days in your reset cycle.
                </p>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--border))] pt-4 grid grid-cols-3 gap-4 text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider mb-1">Reset Cycle</p>
                <p className="font-bold text-[hsl(var(--foreground))] flex items-center gap-1.5 truncate max-w-[280px] md:max-w-[350px]" title={summary?.resetDayText || "—"}>
                  <Calendar className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  {summary?.resetDayText || "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider mb-1">Spent Today</p>
                <p className="font-bold text-[hsl(var(--destructive))]">
                  ฿{summary?.spentToday?.toFixed(2) ?? "0.00"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold tracking-wider mb-1">Canteen Math</p>
                <p className="text-[hsl(var(--foreground))]">floor(Daily Quota / 50)</p>
              </div>
            </div>

            {hints.map((hint, i) => (
              <div
                key={i}
                className="bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.2)] text-[hsl(var(--muted-foreground))] p-3 rounded-lg text-[10px] font-mono leading-normal flex items-start gap-2.5 mt-2"
              >
                <Info className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                <span>{hint.replace("Pacing-Hint: ", "")}</span>
              </div>
            ))}
          </div>
        )}

        {/* Active Warnings */}
        <div className="ds-card p-5 flex flex-col">
          <h3 className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-4">
            Active Warnings
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[200px] no-scrollbar space-y-2.5">
            {warnings && warnings.length > 0 ? (
              warnings.map((warning, i) => (
                <div
                  key={i}
                  className="ds-alert-warning flex items-start gap-2.5 p-3 text-xs font-mono leading-relaxed"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 text-[hsl(var(--muted-foreground))] font-mono">
                <div className="h-10 w-10 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-3">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--primary))]" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                  All Systems Clear
                </p>
                <p className="text-[10px] mt-1 opacity-60">Spending limits are optimized.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 30-Day Trend Chart ────────────────────────────────────────── */}
      <div className="ds-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Allowance vs. Spent Logs</h3>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">
              30-day historical: daily quotas vs. actual costs
            </p>
          </div>
          <div className="ds-badge ds-badge-success">Live</div>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTarget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(142 86% 55%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(142 86% 55%)" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(0 100% 60%)"  stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(0 100% 60%)"  stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 12%)" />
                <XAxis
                  dataKey="formattedDate"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(240 5% 65%)", fontSize: 9, fontFamily: "monospace" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "hsl(240 5% 65%)", fontSize: 9, fontFamily: "monospace" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(240 10% 4%)",
                    borderColor:     "hsl(240 6% 12%)",
                    borderRadius:    "10px",
                    color:           "hsl(0 0% 98%)",
                    fontSize:        "11px",
                    fontFamily:      "monospace",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "10px", fontFamily: "monospace", marginTop: "10px" }}
                />
                <Area
                  name="Target Quota"
                  type="monotone"
                  dataKey="targetQuota"
                  stroke="hsl(142 86% 55%)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#gradTarget)"
                />
                <Area
                  name="Actual Spent"
                  type="monotone"
                  dataKey="actualSpent"
                  stroke="hsl(0 100% 60%)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#gradSpent)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-xs font-mono">
              No historical data in the specified range
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
