"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  X, Loader2, AlertTriangle, Plus, Check, Sparkles, SlidersHorizontal,
  History, ArrowLeft, Wallet, ChevronRight,
} from "lucide-react";
import { CategoryIcon } from "@/app/(dashboard)/categories/page";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/components/ui/CurrencyDisplay";
import { ModalPortal } from "@/components/ui/ModalPortal";

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

  const [step, setStep] = useState<"account" | "presets">("account");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loggingKey, setLoggingKey] = useState<string | null>(null);
  const [loggedKey, setLoggedKey] = useState<string | null>(null);

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

  // If user only has 1 account, auto-select it and skip to presets
  useEffect(() => {
    if (isAccountsFetched && accounts.length === 1 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
      setStep("presets");
    }
  }, [isAccountsFetched, accounts, selectedAccountId]);

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

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || null;

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

  const handleSelectAccount = (acc: Account) => {
    setSelectedAccountId(acc.id);
    setStep("presets");
  };

  const handlePickPreset = (preset: SmartPreset) => {
    if (!activeAccount) {
      showToast("No account selected. Please pick a source account.", "error");
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
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-pick-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="ds-card w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border-[hsl(var(--primary)/0.2)] animate-fadeIn max-h-[88vh] overflow-y-auto no-scrollbar">

          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              {step === "presets" && accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setStep("account")}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  aria-label="Change source account"
                  title="Change source account"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div>
                <h2 id="quick-pick-title" className="text-base font-black tracking-tight flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  Quick Add
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                  {step === "account"
                    ? "Step 1: Select Source Wallet Account"
                    : `Step 2: Pick Shortcut for ${activeAccount?.name || "Account"}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              aria-label="Close quick add modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Zero-account guard */}
          {isAccountsFetched && accounts.length === 0 ? (
            <div className="py-8 text-center space-y-3 border border-dashed border-[hsl(var(--warning)/0.4)] rounded-2xl bg-[hsl(var(--warning)/0.04)] mb-2">
              <div className="mx-auto h-11 w-11 rounded-full bg-[hsl(var(--warning)/0.15)] flex items-center justify-center text-[hsl(var(--warning))]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold">No accounts created yet</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono max-w-xs mx-auto">
                You need at least one wallet account before logging transactions.
              </p>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 1: Select Source Account                              */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {step === "account" && (
                <div className="space-y-3 py-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono mb-2 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    Which account are you spending from?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Select source wallet account">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        role="radio"
                        aria-checked={selectedAccountId === acc.id}
                        onClick={() => handleSelectAccount(acc)}
                        className={`p-4 rounded-xl border flex flex-col justify-between text-left transition-all min-h-[72px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] group ${
                          selectedAccountId === acc.id
                            ? "bg-[hsl(var(--primary)/0.12)] border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                            : "bg-[hsl(var(--secondary))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.4)]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-sm font-bold truncate pr-2">{acc.name}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
                        </div>
                        <span className="text-xs font-mono font-black tabular-nums opacity-90">
                          {formatCurrency(acc.balance, currency)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STEP 2: 6 Most Frequent Transactions Grid + Other           */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {step === "presets" && activeAccount && (
                <div className="space-y-4 py-1">
                  {/* Selected Account Banner */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]">
                    <div className="flex items-center gap-2 min-w-0">
                      <Wallet className="h-4 w-4 text-[hsl(var(--primary))] shrink-0" />
                      <div className="min-w-0 text-xs font-mono">
                        <span className="text-[hsl(var(--muted-foreground))]">Spending from: </span>
                        <strong className="text-[hsl(var(--foreground))] truncate">{activeAccount.name}</strong>
                        <span className="text-[hsl(var(--muted-foreground))]"> ({formatCurrency(activeAccount.balance, currency)})</span>
                      </div>
                    </div>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setStep("account")}
                        className="text-[10px] font-mono font-bold text-[hsl(var(--primary))] hover:underline shrink-0 ml-2 focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] rounded"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {/* 6 Most Frequent Transactions Grid */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono flex items-center gap-1.5 mb-2.5">
                      <History className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                      Frequent Shortcuts
                    </p>

                    {smartPresets.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
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
                              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all min-h-[100px] text-left focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] group relative ${
                                isLogged
                                  ? "bg-[hsl(var(--primary)/0.15)] border-[hsl(var(--primary))]"
                                  : "bg-[hsl(var(--secondary))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.05)]"
                              }`}
                              aria-label={`Log ${preset.label} for ${preset.amount} ${currency}`}
                            >
                              {/* Top row: Category Icon + Frequency badge */}
                              <div className="flex items-center justify-between w-full mb-2">
                                <span className="h-7 w-7 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-center shrink-0 text-[hsl(var(--primary))]">
                                  {catObj?.icon ? (
                                    <CategoryIcon name={catObj.icon} className="h-3.5 w-3.5" />
                                  ) : (
                                    <Wallet className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                                  )}
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                                  ×{preset.count}
                                </span>
                              </div>

                              {/* Label & Category */}
                              <div className="min-w-0 mb-2">
                                <p className="text-xs font-bold leading-snug truncate group-hover:text-[hsl(var(--primary))] transition-colors">
                                  {preset.label}
                                </p>
                                <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] truncate">
                                  {catObj?.name ?? "General"}
                                </p>
                              </div>

                              {/* Bottom row: Amount + Instant submit indicator */}
                              <div className="flex items-center justify-between w-full pt-1 border-t border-[hsl(var(--border)/0.5)]">
                                <span className={`text-xs font-black font-mono tabular-nums ${
                                  isLogged ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"
                                }`}>
                                  −{currency} {preset.amount}
                                </span>
                                <span className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${
                                  isLogged
                                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                                    : "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] group-hover:bg-[hsl(var(--primary))] group-hover:text-[hsl(var(--primary-foreground))]"
                                }`}>
                                  {isLogging ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : isLogged ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Plus className="h-3 w-3" />
                                  )}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : isRecentFetched ? (
                      <div className="py-6 text-center border border-dashed border-[hsl(var(--border))] rounded-xl">
                        <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono italic">
                          Your frequent shortcuts will appear here automatically after your first few expense entries.
                        </p>
                      </div>
                    ) : (
                      <div className="py-6 flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">or custom entry</span>
            <div className="flex-1 h-px bg-[hsl(var(--border))]" />
          </div>

          {/* Other Transaction → opens Wizard */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWizard(activeAccount ? { accountId: activeAccount.id } : undefined);
            }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.04)] transition-all min-h-[48px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] group"
            aria-label="Open full transaction wizard for custom entry"
          >
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center text-[hsl(var(--primary))]">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold">Other Transaction</p>
                <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">Open full 4-step wizard for detailed control</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] transition-colors" />
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
