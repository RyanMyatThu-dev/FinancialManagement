"use client";

import React, { useState, useEffect, useId } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Plus, Zap, SlidersHorizontal, Loader2, Check, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

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

interface QuickAddBarProps {
  onOpenWizard: (initialData?: { amount?: string; description?: string; categoryId?: string; accountId?: string; type?: string }) => void;
}

// Preset shortcuts for one-tap logging
const PRESETS = [
  { label: "Coffee", amount: "5.00", icon: "☕", searchKey: "coffee" },
  { label: "Lunch", amount: "12.50", icon: "🍱", searchKey: "lunch" },
  { label: "Groceries", amount: "35.00", icon: "🛒", searchKey: "grocery" },
  { label: "Transit", amount: "4.00", icon: "🚕", searchKey: "transport" },
];

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
  const [detectedCategory, setDetectedCategory] = useState<Category | null>(null);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  // 1. Fetch Accounts
  const { data: accountsData } = useQuery<{ items: Account[] }>({
    queryKey: ["accounts", "all"],
    queryFn: async () => {
      const res = await apiClient.get("/api/accounts?pageSize=100");
      return res.data.value || { items: [] };
    },
  });
  const accounts = accountsData?.items || [];

  // Set default account when loaded
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // 2. Fetch Categories
  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiClient.get("/api/transactions/categories");
      return res.data.value || [];
    },
  });
  const categories = categoriesData || [];

  // Smart Auto-Categorization engine
  useEffect(() => {
    if (!description.trim() || categories.length === 0) {
      setDetectedCategory(null);
      return;
    }
    const lowerDesc = description.toLowerCase().trim();

    // Find best category match
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
  }, [description, categories]);

  // Quick submit mutation
  const quickLogMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiClient.post("/api/transactions", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to log quick transaction.");
    },
    onSuccess: () => {
      showToast("Express transaction logged!", "success");
      setIsSuccessFeedback(true);
      setTimeout(() => setIsSuccessFeedback(false), 2000);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      qc.invalidateQueries({ queryKey: ["dashboardTrends"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      setDescription("");
      setAmount("");
    },
    onError: (err: Error) => {
      showToast(err.message || "Could not log transaction", "error");
    },
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }
    if (!accountId) {
      showToast("Please select an account", "error");
      return;
    }

    quickLogMutation.mutate({
      accountId,
      targetAccountId: null,
      categoryId: detectedCategory ? detectedCategory.id : null,
      transactionType: "Expense",
      isRecurring: false,
      date: new Date().toISOString(),
      amount: parsedAmount,
      description: description.trim() || null,
      tagIds: null,
    });
  };

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setAmount(preset.amount);
    setDescription(preset.label);
  };

  return (
    <section aria-label="Express Quick Transaction Bar" className="mb-6">
      <div className="ds-card p-3 sm:p-4 border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--card))] shadow-sm transition-all hover:border-[hsl(var(--primary)/0.4)]">
        {/* Header line */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]">
              <Zap className="h-3.5 w-3.5 fill-[hsl(var(--primary))]" />
            </span>
            <h2 className="text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5">
              Express Quick Add
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

        {/* Quick Presets Pills (Horizontal scrollable on small screens) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar scroll-smooth" role="region" aria-label="One-tap expense presets">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] shrink-0 font-mono">
            Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePresetClick(p)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary)/0.1)] hover:border-[hsl(var(--primary)/0.3)] text-xs font-mono text-[hsl(var(--foreground))] transition-all shrink-0 min-h-[44px] sm:min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-bold">({p.amount})</span>
            </button>
          ))}
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
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="ds-input w-full pl-12 pr-3 py-2 text-sm font-mono font-bold min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              autoComplete="off"
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
            {detectedCategory ? (
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] text-[10px] font-bold font-mono animate-fadeIn"
                title={`Auto-detected category: ${detectedCategory.name}`}
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
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Submit Button */}
          <button
            type="submit"
            disabled={quickLogMutation.isPending}
            className="ds-btn-primary px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider min-h-[44px] shrink-0 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            aria-label="Log quick transaction"
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
      </div>
    </section>
  );
}
