"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  X, Loader2, AlertTriangle, Plus, Check, Sparkles, SlidersHorizontal,
  History, ArrowRight, Wallet,
} from "lucide-react";
import { CategoryIcon } from "@/app/(dashboard)/categories/page";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/components/ui/CurrencyDisplay";

interface Account {
  id: string;
  name: string;
  accountType: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
}

interface TransactionRecord {
  description?: string | null;
  amount: number;
  transactionType: string;
  categoryId?: string | null;
}

export interface SmartPreset {
  label: string;
  amount: string;
  categoryId: string | null;
  count: number;
}

// ─── Frequency-based algorithm ───────────────────────────────────────────────
export function deriveSmartPresets(transactions: TransactionRecord[]): SmartPreset[] {
  const expenseTransactions = transactions.filter(
    (tx) => tx.transactionType === "Expense" && tx.description && tx.description.trim().length > 0
  );
  const frequencyMap = new Map<string, { label: string; amount: string; categoryId: string | null; count: number }>();
  for (const tx of expenseTransactions) {
    const label = tx.description!.trim();
    const amount = tx.amount.toFixed(2);
    const key = `${label.toLowerCase()}__${amount}`;
    const existing = frequencyMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      frequencyMap.set(key, { label, amount, categoryId: tx.categoryId ?? null, count: 1 });
    }
  }
  return Array.from(frequencyMap.values()).sort((a, b) => b.count - a.count).slice(0, 6);
}
// ─────────────────────────────────────────────────────────────────────────────

interface QuickPickModalProps {
  onClose: () => void;
  onOpenWizard: (initialData?: { amount?: string; description?: string; categoryId?: string; accountId?: string; type?: string }) => void;
}

export function QuickPickModal({ onClose, onOpenWizard }: QuickPickModalProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const currency = user?.currency || "THB";
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const [loggedKey, setLoggedKey] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Fetch accounts
  const { data: accounts = [], isFetched: isAccountsFetched } = useQuery<Account[]>({
    queryKey: ["accounts", "all"],
    queryFn: async () => {
      const res = await apiClient.get("/api/accounts?pageSize=100");
      if (res.data?.isSuccess) {
        if (Array.isArray(res.data.value)) return res.data.value;
        if (res.data.value?.items && Array.isArray(res.data.value.items)) return res.data.value.items;
      }
      return [];
    },
  });

  // Fetch categories (for icon lookup)
  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiClient.get("/api/transactions/categories");
      if (res.data?.isSuccess) {
        return Array.isArray(res.data.value) ? res.data.value : res.data.value?.items || [];
      }
      return [];
    },
  });
  const categories = categoriesData || [];

  // Fetch recent transactions for frequency presets
  const { data: recentTransactionsData, isFetched: isRecentFetched } = useQuery<TransactionRecord[]>({
    queryKey: ["transactions", "recent-for-presets"],
    queryFn: async () => {
      const res = await apiClient.post("/api/transactions/search", {
        pageSize: 100, page: 1,
        transactionType: null, accountId: null, categoryId: null,
        startDate: null, endDate: null, searchTerm: null,
      });
      if (res.data?.isSuccess) {
        const value = res.data.value;
        if (Array.isArray(value)) return value;
        if (value?.items && Array.isArray(value.items)) return value.items;
      }
      return [];
    },
    staleTime: 30_000,
  });

  const recentTransactions = recentTransactionsData || [];
  const smartPresets: SmartPreset[] = isRecentFetched ? deriveSmartPresets(recentTransactions) : [];

  // Default to first account when accounts load
  const activeAccountId = selectedAccountId ?? accounts[0]?.id ?? null;
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0] || null;

  // Quick log mutation
  const quickLogMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiClient.post("/api/transactions", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to log transaction.");
    },
    onSuccess: (_, variables) => {
      const key = `${variables.description}__${variables.amount}`;
      setLoggedKey(key);
      setLoggingKey(null);
      showToast("Transaction logged!", "success");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions", "recent-for-presets"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      qc.invalidateQueries({ queryKey: ["dashboardTrends"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setTimeout(() => { setLoggedKey(null); onClose(); }, 1200);
    },
    onError: (err: Error) => {
      setLoggingKey(null);
      showToast(err.message || "Could not log transaction", "error");
    },
  });

  const handlePickPreset = (preset: SmartPreset) => {
    if (!activeAccount) {
      showToast("No account available. Please create an account first.", "error");
      return;
    }
    if (parseFloat(preset.amount) > activeAccount.balance) {
      showToast(`Amount exceeds balance of ${activeAccount.name}`, "error");
      return;
    }
    const key = `${preset.label}__${preset.amount}`;
    setLoggingKey(key);
    quickLogMutation.mutate({
      accountId: activeAccount.id,
      targetAccountId: null,
      categoryId: preset.categoryId ?? null,
      transactionType: "Expense",
      isRecurring: false,
      date: new Date().toISOString(),
      amount: parseFloat(preset.amount),
      description: preset.label,
      tagIds: null,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-pick-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ds-card w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border-[hsl(var(--primary)/0.2)] animate-fadeIn max-h-[85vh] overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 id="quick-pick-title" className="text-base font-black tracking-tight flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              Quick Add
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">
              {smartPresets.length > 0 ? "Pick a frequent transaction or add a new one" : "Log a transaction quickly"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-xl flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            aria-label="Close quick add"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Zero-account guard */}
        {isAccountsFetched && accounts.length === 0 ? (
          <div className="py-6 text-center space-y-3 border border-dashed border-[hsl(var(--warning)/0.4)] rounded-2xl bg-[hsl(var(--warning)/0.04)] mb-4">
            <div className="mx-auto h-10 w-10 rounded-full bg-[hsl(var(--warning)/0.15)] flex items-center justify-center text-[hsl(var(--warning))]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold">No accounts created yet</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">You need at least one wallet account before logging transactions.</p>
          </div>
        ) : (
          <>
            {/* Account selector */}
            {accounts.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono mb-2 flex items-center gap-1">
                  <Wallet className="h-3 w-3" /> Source Account
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Select source account">
                  {accounts.map((a) => {
                    const isSelected = activeAccountId === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedAccountId(a.id)}
                        className={`inline-flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all min-h-[52px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                          isSelected
                            ? "bg-[hsl(var(--primary)/0.12)] border-[hsl(var(--primary)/0.5)] text-[hsl(var(--primary))]"
                            : "bg-[hsl(var(--secondary))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.3)]"
                        }`}
                      >
                        <span className="text-xs font-bold leading-tight">{a.name}</span>
                        <span className={`text-[10px] font-mono tabular-nums ${isSelected ? "text-[hsl(var(--primary)/0.8)]" : "text-[hsl(var(--muted-foreground))]"}` }>
                          {formatCurrency(a.balance, currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Frequent Transaction Cards */}
            {smartPresets.length > 0 ? (
              <div className="space-y-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono flex items-center gap-1">
                  <History className="h-3 w-3" /> Your Frequent Transactions
                </p>
                <div className="space-y-2">
                  {smartPresets.map((preset) => {
                    const key = `${preset.label}__${preset.amount}`;
                    const isLogging = loggingKey === key;
                    const isLogged = loggedKey === key;
                    const catObj = preset.categoryId ? categories.find((c) => c.id === preset.categoryId) : null;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePickPreset(preset)}
                        disabled={!!loggingKey || !!loggedKey}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all min-h-[60px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] group ${
                          isLogged
                            ? "bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary)/0.4)]"
                            : "bg-[hsl(var(--secondary))] border-[hsl(var(--border))] hover:bg-[hsl(var(--primary)/0.06)] hover:border-[hsl(var(--primary)/0.3)]"
                        }`}
                        aria-label={`Log ${preset.label} for ${preset.amount} ${currency}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Category icon or fallback */}
                          <span className="h-9 w-9 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-center shrink-0 text-[hsl(var(--primary))]">
                            {catObj?.icon ? (
                              <CategoryIcon name={catObj.icon} className="h-4.5 w-4.5" />
                            ) : (
                              <Wallet className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            )}
                          </span>
                          <div className="min-w-0 text-left">
                            <p className="text-sm font-semibold truncate">{preset.label}</p>
                            <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                              {catObj?.name ?? "No category"} · ×{preset.count} logged
                            </p>
                          </div>
                        </div>

                        {/* Amount + action */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-sm font-black font-mono tabular-nums ${
                            isLogged ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"
                          }`}>
                            −{currency} {preset.amount}
                          </span>
                          <span className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                            isLogged
                              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                              : "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))]"
                          }`}>
                            {isLogging ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isLogged ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : isRecentFetched ? (
              <div className="mb-4 py-4 text-center border border-dashed border-[hsl(var(--border))] rounded-xl">
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono italic">
                  Your frequent transactions will appear here after your first few entries.
                </p>
              </div>
            ) : (
              <div className="mb-4 py-4 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]" />
              </div>
            )}
          </>
        )}

        {/* Divider */}
        <div className="relative flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-[hsl(var(--border))]" />
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-[hsl(var(--border))]" />
        </div>

        {/* Other Transaction → opens Wizard */}
        <button
          type="button"
          onClick={() => { onClose(); onOpenWizard(); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.04)] transition-all min-h-[52px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] group"
          aria-label="Open full transaction wizard for a new transaction"
        >
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))]">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold">Other Transaction</p>
              <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">Full wizard with all options</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
        </button>
      </div>
    </div>
  );
}
