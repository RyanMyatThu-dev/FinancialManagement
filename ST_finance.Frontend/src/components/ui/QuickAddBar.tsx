"use client";

import React, { useState, useEffect, useId } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Plus, Zap, SlidersHorizontal, Loader2, Check, Sparkles, AlertTriangle, History, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/components/ui/CurrencyDisplay";
import { CreateAccountModal } from "@/components/ui/CreateAccountModal";
import { numericInputProps } from "@/lib/numericInputProps";

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
}

interface TransactionRecord {
  description?: string | null;
  amount: number;
  transactionType: string;
  categoryId?: string | null;
}

interface SmartPreset {
  label: string;
  amount: string;
  categoryId: string | null;
  count: number;
}

interface QuickAddBarProps {
  onOpenWizard: (initialData?: { amount?: string; description?: string; categoryId?: string; accountId?: string; type?: string }) => void;
}

// ─── Frequency-based personalised preset algorithm ───────────────────────────
// Groups last 100 transactions by (description, amount) pairs, returns top 4.
function deriveSmartPresets(transactions: TransactionRecord[]): SmartPreset[] {
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
      frequencyMap.set(key, {
        label,
        amount,
        categoryId: tx.categoryId ?? null,
        count: 1,
      });
    }
  }

  return Array.from(frequencyMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
}
// ─────────────────────────────────────────────────────────────────────────────

export function QuickAddBar({ onOpenWizard }: QuickAddBarProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const currency = user?.currency || "THB";

  const descriptionId = useId();
  const amountId = useId();
  const accountIdSelectId = useId();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<Category | null>(null);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  // Whether the category row is expanded (true once user has typed)
  const [categoryRowVisible, setCategoryRowVisible] = useState(false);

  // 1. Fetch Accounts with robust array/object parsing
  const { data: accounts = [], isLoading: isAccountsLoading, isFetched: isAccountsFetched } = useQuery<Account[]>({
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

  // Selected account for real-time balance checks
  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0] || null;

  // Real-time balance guardrail
  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficientBalance = selectedAccount ? parsedAmount > selectedAccount.balance : false;

  // Set default account when loaded
  useEffect(() => {
    if (accounts.length > 0 && (!accountId || !accounts.some((a) => a.id === accountId))) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // 2. Fetch Categories (for auto-categorisation)
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

  // 3. Fetch last 100 transactions for personalised presets
  const { data: recentTransactionsData, isFetched: isRecentFetched } = useQuery<TransactionRecord[]>({
    queryKey: ["transactions", "recent-for-presets"],
    queryFn: async () => {
      const res = await apiClient.post("/api/transactions/search", {
        pageSize: 100,
        page: 1,
        transactionType: null,
        accountId: null,
        categoryId: null,
        startDate: null,
        endDate: null,
        searchTerm: null,
      });
      if (res.data?.isSuccess) {
        const value = res.data.value;
        if (Array.isArray(value)) return value;
        if (value?.items && Array.isArray(value.items)) return value.items;
      }
      return [];
    },
    staleTime: 30_000, // refresh every 30s
  });

  const recentTransactions = recentTransactionsData || [];
  const smartPresets: SmartPreset[] = isRecentFetched ? deriveSmartPresets(recentTransactions) : [];

  // Smart Auto-Categorisation engine — auto-selects & highlights chip
  useEffect(() => {
    if (!description.trim() || categories.length === 0) {
      setDetectedCategory(null);
      return;
    }
    const lowerDesc = description.toLowerCase().trim();
    const match = categories.find((cat) => {
      const cName = cat.name.toLowerCase();
      if (lowerDesc.includes(cName) || cName.includes(lowerDesc)) return true;
      if (lowerDesc.includes("starbucks") || lowerDesc.includes("cafe") || lowerDesc.includes("coffee")) return cName.includes("food") || cName.includes("dining") || cName.includes("drink");
      if (lowerDesc.includes("grab") || lowerDesc.includes("uber") || lowerDesc.includes("bus") || lowerDesc.includes("train") || lowerDesc.includes("taxi")) return cName.includes("transport") || cName.includes("travel");
      if (lowerDesc.includes("tuition") || lowerDesc.includes("book") || lowerDesc.includes("school")) return cName.includes("education") || cName.includes("school");
      if (lowerDesc.includes("supermarket") || lowerDesc.includes("grocery") || lowerDesc.includes("mart")) return cName.includes("grocery") || cName.includes("food");
      return false;
    });
    setDetectedCategory(match || null);
    // Auto-highlight detected category only if user hasn't manually overridden
    if (match) setSelectedCategoryId((prev) => prev ?? match.id);
    // Expand category row once user starts typing
    if (!categoryRowVisible) setCategoryRowVisible(true);
  }, [description, categories]);

  // Quick submit mutation
  const quickLogMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiClient.post("/api/transactions", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to log quick transaction.");
    },
    onSuccess: () => {
      showToast("Transaction logged!", "success");
      setIsSuccessFeedback(true);
      setTimeout(() => setIsSuccessFeedback(false), 2000);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions", "recent-for-presets"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      qc.invalidateQueries({ queryKey: ["dashboardTrends"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setDescription("");
      setAmount("");
      setSelectedCategoryId(null);
      setCategoryRowVisible(false);
    },
    onError: (err: Error) => {
      showToast(err.message || "Could not log transaction", "error");
    },
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.length === 0) {
      showToast("No account created yet. Please create an account first.", "error");
      return;
    }
    if (parsedAmount <= 0) {
      showToast("Please enter a valid amount greater than 0", "error");
      return;
    }
    if (!accountId) {
      showToast("Please select an account", "error");
      return;
    }
    if (isInsufficientBalance) {
      showToast(`Amount exceeds balance of ${selectedAccount?.name}`, "error");
      return;
    }

    quickLogMutation.mutate({
      accountId,
      targetAccountId: null,
      categoryId: selectedCategoryId ?? (detectedCategory ? detectedCategory.id : null),
      transactionType: "Expense",
      isRecurring: false,
      date: new Date().toISOString(),
      amount: parsedAmount,
      description: description.trim() || null,
      tagIds: null,
    });
  };

  const handlePresetClick = (preset: SmartPreset) => {
    setAmount(preset.amount);
    setDescription(preset.label);
    // Pre-select the category from the preset if available
    if (preset.categoryId) setSelectedCategoryId(preset.categoryId);
    setCategoryRowVisible(true);
  };

  // ── ZERO-ACCOUNT GUARDRAIL ──────────────────────────────────────────────────
  if (isAccountsFetched && accounts.length === 0) {
    return (
      <section aria-label="Quick Add Transaction Bar" className="mb-6">
        <div className="ds-card p-4 sm:p-5 border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)] shadow-md animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))] shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">
                  No accounts created yet
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono leading-relaxed">
                  You need at least one wallet account before logging transactions.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(true)}
                className="ds-btn-primary px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <Plus className="h-4 w-4" /> Create Account
              </button>
            </div>
          </div>
        </div>
        {showCreateAccountModal && (
          <CreateAccountModal onClose={() => setShowCreateAccountModal(false)} />
        )}
      </section>
    );
  }

  return (
    <section aria-label="Quick Add Transaction Bar" className="mb-6">
      <div className="ds-card p-3 sm:p-4 border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--card))] shadow-sm transition-all hover:border-[hsl(var(--primary)/0.4)]">
        {/* Header line */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
              <Zap className="h-3.5 w-3.5 fill-[hsl(var(--primary))]" />
            </span>
            <h2 className="text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5">
              Quick Add
              <span className="hidden sm:inline-block text-[10px] font-normal text-[hsl(var(--muted-foreground))]">
                (Logged as Expense today)
              </span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenWizard({ amount, description, categoryId: detectedCategory?.id, accountId })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.1)] transition-colors min-h-[44px] sm:min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            aria-label="Open guided multi-step wizard for detailed transaction logging"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Detailed Wizard</span>
          </button>
        </div>

        {/* Personalised Smart Presets */}
        <div className="mb-3" role="region" aria-label="Your most frequent expense shortcuts">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono flex items-center gap-1 mb-2">
            <History className="h-3 w-3" /> Your Shortcuts
          </span>

          {isRecentFetched && smartPresets.length === 0 ? (
            // Empty-state message for new users
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono italic py-1">
              Your personalised shortcuts will appear here after your first few transactions.
            </p>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
              {smartPresets.map((p) => (
                <button
                  key={`${p.label}__${p.amount}`}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary)/0.1)] hover:border-[hsl(var(--primary)/0.3)] text-xs font-mono text-[hsl(var(--foreground))] transition-all shrink-0 min-h-[44px] sm:min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  aria-label={`Preset: ${p.label}, ${p.amount} ${currency}, used ${p.count} time${p.count > 1 ? "s" : ""}`}
                >
                  <span className="font-semibold truncate max-w-[80px]">{p.label}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-bold shrink-0">
                    {currency} {p.amount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Express Input Form */}
        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5" autoComplete="off">
          {/* Amount input */}
          <div className="relative flex-1 min-w-[120px]">
            <label htmlFor={amountId} className="sr-only">
              Amount ({currency})
            </label>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[hsl(var(--muted-foreground))]">
              {currency}
            </div>
            <input
              id={amountId}
              {...numericInputProps}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`ds-input w-full pl-12 pr-3 py-2 text-sm font-mono font-bold min-h-[44px] focus-visible:ring-2 ${
                isInsufficientBalance ? "border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]" : "focus-visible:ring-[hsl(var(--ring))]"
              }`}
            />
          </div>

          {/* Description input with Auto-Category Badge */}
          <div className="relative flex-[2] min-w-[180px]">
            <label htmlFor={descriptionId} className="sr-only">
              Description (e.g. Starbucks, Tuition)
            </label>
            <input
              id={descriptionId}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (e.g. Coffee, Lunch)"
              className="ds-input w-full px-3 py-2 text-sm min-h-[44px] pr-28 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              autoComplete="off"
            />
          {detectedCategory && !selectedCategoryId ? (
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] text-[10px] font-bold font-mono animate-fadeIn"
                title={`Auto-detected: ${detectedCategory.name}`}
              >
                <Sparkles className="h-3 w-3" />
                {detectedCategory.name}
              </span>
            ) : null}
          </div>

          {/* Account selector */}
          <div className="min-w-[140px]">
            <label htmlFor={accountIdSelectId} className="sr-only">
              Select Wallet Account
            </label>
            <select
              id={accountIdSelectId}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="ds-input w-full px-3 py-2 text-xs font-mono min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance, currency)})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Submit Button */}
          <button
            type="submit"
            disabled={quickLogMutation.isPending || isInsufficientBalance || accounts.length === 0}
            className="ds-btn-primary px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider min-h-[44px] shrink-0 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            aria-label="Log quick expense transaction"
          >
            {quickLogMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSuccessFeedback ? (
              <>
                <Check className="h-4 w-4 text-white" /> Logged!
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Log Expense
              </>
            )}
          </button>
        </form>

        {/* Real-time Overdraft Balance Guardrail */}
        {isInsufficientBalance && selectedAccount && (
          <div role="alert" className="mt-2.5 p-2 px-3 rounded-lg bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] text-xs text-[hsl(var(--destructive))] font-mono flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              <strong>Guardrail:</strong> Amount ({parsedAmount.toFixed(2)} {currency}) exceeds balance of {selectedAccount.name} ({formatCurrency(selectedAccount.balance, currency)}).
            </span>
          </div>
        )}

        {/* Inline Category Chip Row — expands once user starts typing */}
        {categoryRowVisible && categories.filter((c) => c.type === "Expense").length > 0 && (
          <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] animate-fadeIn">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-[hsl(var(--primary))]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-mono">
                Category
              </span>
              {selectedCategoryId && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="ml-auto text-[10px] font-mono text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] rounded"
                  aria-label="Clear category selection"
                >
                  Clear
                </button>
              )}
            </div>
            <div
              className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
              role="group"
              aria-label="Select expense category"
            >
              {categories
                .filter((c) => c.type === "Expense")
                .map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  const isAutoDetected = detectedCategory?.id === cat.id && !selectedCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelectedCategoryId((prev) => (prev === cat.id ? null : cat.id))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono shrink-0 transition-all min-h-[36px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                        isSelected
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
                          : isAutoDetected
                          ? "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.4)] font-bold"
                          : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)]"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {isAutoDetected && !isSelected && <Sparkles className="h-3 w-3" />}
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {showCreateAccountModal && (
        <CreateAccountModal onClose={() => setShowCreateAccountModal(false)} />
      )}
    </section>
  );
}
