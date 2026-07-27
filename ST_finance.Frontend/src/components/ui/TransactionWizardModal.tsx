"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  X, Loader2, AlertTriangle, Plus, Tag, ArrowRight, ArrowLeft,
  Check, Sparkles, Wallet, ChevronLeft, ChevronRight, Edit2,
} from "lucide-react";
import { CategoryIcon } from "@/app/(dashboard)/categories/page";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/components/ui/CurrencyDisplay";
import { useToast } from "@/context/ToastContext";
import { CreateAccountModal } from "@/components/ui/CreateAccountModal";
import { numericInputProps } from "@/lib/numericInputProps";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface TransactionWizardModalProps {
  onClose: () => void;
  initialData?: {
    amount?: string;
    description?: string;
    categoryId?: string;
    accountId?: string;
    type?: string;
  };
}

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

interface TagType {
  id: string;
  name: string;
}

const CATEGORY_PAGE_SIZE = 6;
const TAG_PAGE_SIZE = 10;

export function TransactionWizardModal({ onClose, initialData }: TransactionWizardModalProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const currency = user?.currency || "THB";

  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const amountInputId = useId();
  const descInputId = useId();
  const dateInputId = useId();

  // Wizard Step State (1–4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [transactionType, setTransactionType] = useState<string>(initialData?.type || "Expense");
  const [amount, setAmount] = useState<string>(initialData?.amount || "");
  const [accountId, setAccountId] = useState<string>(initialData?.accountId || "");
  const [targetAccountId, setTargetAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId || "");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>(initialData?.description || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showOverdraftModal, setShowOverdraftModal] = useState<boolean>(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState<boolean>(false);

  // Pagination state for category & tag pickers
  const [categoryPage, setCategoryPage] = useState(0);
  const [tagPage, setTagPage] = useState(0);

  // Inline Category Creation states
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>("#10B981");
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>("Wallet");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // 1. Fetch Accounts with robust parsing
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

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0] || null;
  const currentNetBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const txAmount = parseFloat(amount) || 0;
  const isInsufficientBalance = selectedAccount && transactionType === "Expense" ? txAmount > selectedAccount.balance : false;
  const proposedNetBalance =
    transactionType === "Expense" ? currentNetBalance - txAmount :
    transactionType === "Income" ? currentNetBalance + txAmount :
    currentNetBalance;
  const isOverdraft = proposedNetBalance < 0;

  // 2. Fetch Categories
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
  const filteredCategories = categories.filter((c) => c.type === transactionType);
  const totalCategoryPages = Math.ceil(filteredCategories.length / CATEGORY_PAGE_SIZE);
  const paginatedCategories = filteredCategories.slice(
    categoryPage * CATEGORY_PAGE_SIZE,
    (categoryPage + 1) * CATEGORY_PAGE_SIZE
  );
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  // 3. Fetch Tags
  const { data: tagsData } = useQuery<TagType[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await apiClient.get("/api/transactions/tags");
      if (res.data?.isSuccess) {
        return Array.isArray(res.data.value) ? res.data.value : res.data.value?.items || [];
      }
      return [];
    },
  });
  const tags = tagsData || [];
  const totalTagPages = Math.ceil(tags.length / TAG_PAGE_SIZE);
  const paginatedTags = tags.slice(tagPage * TAG_PAGE_SIZE, (tagPage + 1) * TAG_PAGE_SIZE);
  const selectedTagObjects = tags.filter((t) => selectedTagIds.includes(t.id));

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && (!accountId || !accounts.some((a) => a.id === accountId))) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Reset category page when type changes
  useEffect(() => {
    setCategoryPage(0);
    if (initialData?.categoryId) return;
    const filteredCats = categories.filter((c) => c.type === transactionType);
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    } else {
      setCategoryId("");
    }
  }, [transactionType]);

  // Focus Trapping & Accessibility
  useEffect(() => {
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) { lastEl?.focus(); e.preventDefault(); }
        } else {
          if (document.activeElement === lastEl) { firstEl?.focus(); e.preventDefault(); }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (body: { name: string; type: string; icon: string; color: string }) => {
      const res = await apiClient.post("/api/transactions/categories", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create category");
    },
    onSuccess: (newCat) => {
      showToast("Category created successfully", "success");
      qc.setQueryData<Category[]>(["categories"], (old) => [...(old || []), newCat]);
      setCategoryId(newCat.id);
      setNewCategoryName("");
      setShowAddCategory(false);
      setCategoryError(null);
    },
    onError: (err: any) => {
      setCategoryError(err.message || "Failed to create category");
    },
  });

  // Create Transaction Mutation
  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiClient.post("/api/transactions", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to add transaction.");
    },
    onSuccess: () => {
      showToast("Transaction registered successfully", "success");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["transactions", "recent-for-presets"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      qc.invalidateQueries({ queryKey: ["dashboardTrends"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
    },
    onError: (err: Error) => {
      if (err.message.includes("InsufficientNetBalance") || err.message.includes("negative total net balance")) {
        setShowOverdraftModal(true);
      } else {
        setError(err.message);
      }
    },
  });

  // Navigation: Next Step
  const validateAndNextStep = () => {
    setError(null);
    if (accounts.length === 0) {
      setError("No accounts created yet. Please create an account before proceeding.");
      return;
    }
    if (currentStep === 1) {
      const parsedAmountVal = parseFloat(amount);
      if (isNaN(parsedAmountVal) || parsedAmountVal <= 0) {
        setError("Please enter a valid amount greater than 0.");
        return;
      }
      if (isInsufficientBalance) {
        setError(`Amount exceeds balance of ${selectedAccount?.name} (${selectedAccount?.balance.toFixed(2)} ${currency}).`);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!accountId) { setError("Please select a source account."); return; }
      if (transactionType === "Transfer" && !targetAccountId) { setError("Please select a target account for transfer."); return; }
      if (transactionType === "Transfer" && accountId === targetAccountId) { setError("Source and Target accounts must be different."); return; }
      if (isInsufficientBalance) { setError(`Amount exceeds balance of ${selectedAccount?.name}.`); return; }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!date) { setError("Please select a valid date."); return; }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
  };

  const handleSubmit = () => {
    setError(null);
    if (accounts.length === 0) { setError("No accounts created yet."); return; }
    const parsedAmountVal = parseFloat(amount);
    if (isNaN(parsedAmountVal) || parsedAmountVal <= 0) { setError("Amount must be greater than zero."); return; }
    if (!accountId) { setError("Please select a source account."); return; }
    if (isInsufficientBalance) { setError(`Amount exceeds balance of ${selectedAccount?.name}.`); return; }
    if (!date) { setError("Please select a valid date."); return; }

    mutation.mutate({
      accountId,
      targetAccountId: transactionType === "Transfer" ? targetAccountId : null,
      categoryId: transactionType !== "Transfer" && categoryId ? categoryId : null,
      transactionType,
      isRecurring,
      date: new Date(date).toISOString(),
      amount: parsedAmountVal,
      description: description.trim() || null,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : null,
    });
  };

  const STEP_LABELS = ["Type & Amount", "Account & Category", "Details & Tags", "Review & Submit"];

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      >
      <div
        ref={modalRef}
        className="ds-card w-full max-w-lg p-5 sm:p-6 relative max-h-[92vh] sm:max-h-[88vh] flex flex-col gap-0 overflow-y-auto no-scrollbar shadow-2xl border-[hsl(var(--primary)/0.3)] animate-fadeIn"
      >
        {/* ── Header ── */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-mono font-bold text-xs">
                {currentStep}/4
              </span>
              <div>
                <h2 id="wizard-modal-title" className="text-base sm:text-lg font-bold tracking-tight">
                  Guided Transaction Setup
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Step {currentStep}: {STEP_LABELS[currentStep - 1]}
                </p>
              </div>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="ds-btn-icon h-9 w-9 rounded-lg flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              aria-label="Close transaction wizard"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ── Step Indicator: circles ON the connecting line ── */}
          <div
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={4}
            aria-label={`Step ${currentStep} of 4: ${STEP_LABELS[currentStep - 1]}`}
            className="relative flex items-start justify-between mt-5 mb-5 px-0"
          >
            {/* Background track line — runs through circle centres (top-3 = half of h-6 circle) */}
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-[hsl(var(--secondary))]" aria-hidden="true" />
            {/* Filled progress line */}
            <div
              className="absolute top-3 left-3 h-0.5 bg-[hsl(var(--primary))] transition-all duration-500 ease-out"
              style={{ width: `calc(${((currentStep - 1) / 3) * 100}% - ${currentStep === 1 ? 0 : currentStep === 4 ? 24 : 0}px)`, right: "auto" }}
              aria-hidden="true"
            />
            {STEP_LABELS.map((label, idx) => {
              const step = idx + 1;
              const isDone = step < currentStep;
              const isCurrent = step === currentStep;
              return (
                <div key={label} className="relative z-10 flex flex-col items-center gap-1.5" style={{ flex: "0 0 auto" }}>
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${
                      isDone
                        ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : isCurrent
                        ? "bg-[hsl(var(--card))] border-[hsl(var(--primary))] text-[hsl(var(--primary))] shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
                        : "bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                    }`}
                    aria-hidden="true"
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : step}
                  </span>
                  <span className={`text-[9px] font-mono text-center leading-tight hidden sm:block max-w-[64px] ${
                    isCurrent ? "text-[hsl(var(--foreground))] font-bold" : "text-[hsl(var(--muted-foreground))]"
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ARIA Live Region */}
          <div aria-live="assertive" className="sr-only">
            Step {currentStep} of 4: {STEP_LABELS[currentStep - 1]}. {error || ""}
          </div>

          {error && (
            <div role="alert" className="ds-alert-error flex items-start gap-2 p-3 mb-4 text-xs font-mono rounded-lg">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* ── ZERO ACCOUNTS GUARDRAIL SCREEN ── */}
          {isAccountsFetched && accounts.length === 0 ? (
            <div className="py-8 px-4 text-center space-y-4 my-2 border border-dashed border-[hsl(var(--warning)/0.4)] rounded-2xl bg-[hsl(var(--warning)/0.04)]">
              <div className="mx-auto h-12 w-12 rounded-full bg-[hsl(var(--warning)/0.15)] border border-[hsl(var(--warning)/0.3)] flex items-center justify-center text-[hsl(var(--warning))]">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">No accounts created yet</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono max-w-sm mx-auto leading-relaxed">
                  You need at least one wallet account before logging transactions.
                </p>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(true)}
                  className="ds-btn-primary px-5 py-2.5 text-xs font-bold w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Create Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════ */}
              {/* STEP 1: Transaction Type & Amount                        */}
              {/* ═══════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <div className="space-y-5 py-2">
                  <div>
                    <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
                      1. Transaction Type
                    </p>
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Select transaction type">
                      {["Expense", "Income", "Transfer"].map((t) => {
                        const isSelected = transactionType === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setTransactionType(t)}
                            className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                              isSelected
                                ? t === "Expense"
                                  ? "bg-[hsl(var(--destructive))] text-white shadow-md"
                                  : t === "Income"
                                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md"
                                  : "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                                : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label htmlFor={amountInputId} className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
                      2. Amount ({currency})
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-mono font-bold text-[hsl(var(--muted-foreground))]">
                        {currency}
                      </div>
                      <input
                        id={amountInputId}
                        {...numericInputProps}
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`ds-input w-full pl-16 pr-4 py-3 text-2xl font-mono font-black min-h-[52px] focus-visible:ring-2 ${
                          isInsufficientBalance ? "border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]" : "focus-visible:ring-[hsl(var(--ring))]"
                        }`}
                        autoFocus
                      />
                    </div>
                    {isInsufficientBalance && selectedAccount && (
                      <p className="mt-1.5 text-xs text-[hsl(var(--destructive))] font-mono font-bold flex items-center gap-1" role="alert">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Exceeds balance of {selectedAccount.name} ({formatCurrency(selectedAccount.balance, currency)})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* STEP 2: Account & Category                               */}
              {/* ═══════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <div className="space-y-4 py-2">
                  {/* Account selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="wizard-source-account" className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                        {transactionType === "Transfer" ? "Source Account" : "Account"}
                      </label>
                      <select
                        id="wizard-source-account"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="ds-input w-full px-3 py-2.5 text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({formatCurrency(a.balance, currency)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {transactionType === "Transfer" && (
                      <div>
                        <label htmlFor="wizard-target-account" className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                          Target Account
                        </label>
                        <select
                          id="wizard-target-account"
                          value={targetAccountId}
                          onChange={(e) => setTargetAccountId(e.target.value)}
                          className="ds-input w-full px-3 py-2.5 text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        >
                          <option value="">Select target...</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({formatCurrency(a.balance, currency)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Category picker (not for Transfer) */}
                  {transactionType !== "Transfer" && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono">
                          Category
                        </label>
                        {!showAddCategory && (
                          <button
                            type="button"
                            onClick={() => setShowAddCategory(true)}
                            className="text-xs text-[hsl(var(--primary))] font-bold hover:underline font-mono min-h-[36px] px-2 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                          >
                            + New
                          </button>
                        )}
                      </div>

                      {showAddCategory ? (
                        <div className="p-3 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl space-y-3">
                          <input
                            type="text"
                            placeholder="Category Name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="ds-input w-full px-3 py-2 text-xs min-h-[44px]"
                            autoFocus
                          />
                          {categoryError && <p className="text-xs text-[hsl(var(--destructive))] font-mono">{categoryError}</p>}
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!newCategoryName.trim()) return;
                                createCategoryMutation.mutate({
                                  name: newCategoryName.trim(),
                                  type: transactionType,
                                  icon: newCategoryIcon,
                                  color: newCategoryColor,
                                });
                              }}
                              disabled={createCategoryMutation.isPending}
                              className="ds-btn-primary px-3 py-1.5 text-xs min-h-[36px]"
                            >
                              {createCategoryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddCategory(false)}
                              className="px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] min-h-[36px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {filteredCategories.length === 0 ? (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono italic py-2">
                              No categories yet for {transactionType}. Click "+ New" to add one.
                            </p>
                          ) : (
                            <>
                              {/* Icon Grid — 6 per page */}
                              <div
                                role="radiogroup"
                                aria-label="Select a category"
                                className="grid grid-cols-3 gap-2"
                              >
                                {paginatedCategories.map((c) => {
                                  const isSelected = categoryId === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      role="radio"
                                      aria-checked={isSelected}
                                      onClick={() => setCategoryId(c.id)}
                                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all min-h-[64px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                                        isSelected
                                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] font-bold"
                                          : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.4)]"
                                      }`}
                                    >
                                      <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-base transition-colors ${
                                        isSelected ? "bg-[hsl(var(--primary)/0.15)]" : "bg-[hsl(var(--background))]"
                                      }`}>
                                        <CategoryIcon name={c.icon || "FolderOpen"} className="h-4.5 w-4.5" />
                                      </span>
                                      <span className="text-[10px] text-center leading-tight line-clamp-2 w-full">{c.name}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Pagination controls */}
                              {totalCategoryPages > 1 && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[hsl(var(--border))]">
                                  <button
                                    type="button"
                                    onClick={() => setCategoryPage((p) => Math.max(0, p - 1))}
                                    disabled={categoryPage === 0}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 min-h-[36px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                                    aria-label="Previous categories page"
                                  >
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                  </button>
                                  <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                                    {categoryPage + 1} / {totalCategoryPages}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages - 1, p + 1))}
                                    disabled={categoryPage >= totalCategoryPages - 1}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 min-h-[36px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                                    aria-label="Next categories page"
                                  >
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* STEP 3: Details & Tags                                   */}
              {/* ═══════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={dateInputId} className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                        Transaction Date
                      </label>
                      <input
                        id={dateInputId}
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="ds-input w-full px-3 py-2.5 text-sm font-mono min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                      />
                    </div>

                    <div>
                      <label htmlFor={descInputId} className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                        Description / Note
                      </label>
                      <input
                        id={descInputId}
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Coffee, Tuition"
                        className="ds-input w-full px-3 py-2.5 text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Recurring Toggle */}
                  <div className="flex items-center gap-3 py-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isRecurring}
                      onClick={() => setIsRecurring((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:outline-none ${
                        isRecurring ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                          isRecurring ? "translate-x-6" : "translate-x-1"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <span className="text-xs font-mono text-[hsl(var(--foreground))]">Mark as recurring transaction</span>
                  </div>

                  {/* Tag Pill Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
                      Tags (Optional)
                    </label>

                    {tags.length === 0 ? (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono italic py-1">
                        No tags created yet. You can add tags from the Tags page.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Select tags">
                          {paginatedTags.map((tag) => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() =>
                                  setSelectedTagIds((prev) =>
                                    prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                                  )
                                }
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-mono transition-all min-h-[36px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                                  isSelected
                                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))]"
                                    : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.4)]"
                                }`}
                              >
                                <Tag className="h-3 w-3" />
                                <span>{tag.name}</span>
                                {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Tag Pagination */}
                        {totalTagPages > 1 && (
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[hsl(var(--border))]">
                            <button
                              type="button"
                              onClick={() => setTagPage((p) => Math.max(0, p - 1))}
                              disabled={tagPage === 0}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 min-h-[36px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                              aria-label="Previous tags page"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" /> Prev
                            </button>
                            <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                              {tagPage + 1} / {totalTagPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setTagPage((p) => Math.min(totalTagPages - 1, p + 1))}
                              disabled={tagPage >= totalTagPages - 1}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-30 min-h-[36px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                              aria-label="Next tags page"
                            >
                              Next <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Overdraft Alert */}
                  {isOverdraft && (
                    <div role="alert" className="ds-alert-error p-3.5 rounded-xl border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.08)] text-xs text-[hsl(var(--destructive))] font-mono">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[10px]">Overdraft Prevention Block</p>
                          <p className="mt-1 leading-relaxed">
                            Total net balance is {currentNetBalance.toFixed(2)} {currency}. Logging {txAmount.toFixed(2)} {currency} expense will exceed your total balance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════ */}
              {/* STEP 4: Review & Submit                                  */}
              {/* ═══════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <div className="py-2 space-y-3">
                  <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono mb-3">
                    Review your transaction before submitting
                  </p>

                  {/* Review Card */}
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] divide-y divide-[hsl(var(--border))] overflow-hidden">

                    {/* Type & Amount */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Type & Amount</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            transactionType === "Expense"
                              ? "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))]"
                              : transactionType === "Income"
                              ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
                              : "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))]"
                          }`}>{transactionType}</span>
                          <span className="text-base font-black font-mono">
                            {formatCurrency(parseFloat(amount) || 0, currency)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCurrentStep(1); setError(null); }}
                        className="text-[hsl(var(--primary))] hover:opacity-70 p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] min-h-[36px]"
                        aria-label="Edit type and amount"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Account */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                          {transactionType === "Transfer" ? "From → To" : "Account"}
                        </p>
                        <p className="text-sm font-semibold">
                          {accounts.find((a) => a.id === accountId)?.name || "—"}
                          {transactionType === "Transfer" && targetAccountId && (
                            <> → {accounts.find((a) => a.id === targetAccountId)?.name}</>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCurrentStep(2); setError(null); }}
                        className="text-[hsl(var(--primary))] hover:opacity-70 p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] min-h-[36px]"
                        aria-label="Edit account"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Category */}
                    {transactionType !== "Transfer" && (
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Category</p>
                          <div className="flex items-center gap-1.5">
                            {selectedCategoryObj?.icon && (
                              <span className="h-5 w-5 rounded flex items-center justify-center bg-[hsl(var(--primary)/0.1)]">
                                <CategoryIcon name={selectedCategoryObj.icon} className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <p className="text-sm font-semibold">{selectedCategoryObj?.name || <span className="italic text-[hsl(var(--muted-foreground))]">None</span>}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setCurrentStep(2); setError(null); }}
                          className="text-[hsl(var(--primary))] hover:opacity-70 p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] min-h-[36px]"
                          aria-label="Edit category"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Date & Description */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Date & Note</p>
                        <p className="text-sm font-semibold">
                          {date ? new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          {description && <span className="text-[hsl(var(--muted-foreground))] font-normal"> · {description}</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCurrentStep(3); setError(null); }}
                        className="text-[hsl(var(--primary))] hover:opacity-70 p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] min-h-[36px]"
                        aria-label="Edit date and description"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Tags</p>
                        {selectedTagObjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedTagObjects.map((t) => (
                              <span key={t.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] text-[10px] font-mono font-bold">
                                <Tag className="h-2.5 w-2.5" />{t.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[hsl(var(--muted-foreground))] italic">None</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCurrentStep(3); setError(null); }}
                        className="text-[hsl(var(--primary))] hover:opacity-70 p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] min-h-[36px] self-start mt-0.5"
                        aria-label="Edit tags"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Recurring */}
                    {isRecurring && (
                      <div className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                          ↻ Recurring
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Overdraft Block on Review step */}
                  {isOverdraft && (
                    <div role="alert" className="p-3 rounded-xl border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.08)] text-xs text-[hsl(var(--destructive))] font-mono flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>This transaction will overdraft your total balance. Please reduce the amount or change the account.</p>
                    </div>
                  )}

                  {/* ARIA live region for submit errors */}
                  <div aria-live="polite" className="sr-only">{error || ""}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Wizard Footer Navigation ── */}
        <div className="pt-4 border-t border-[hsl(var(--border))] flex items-center justify-between gap-3 mt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="ds-btn-outline px-4 py-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ds-btn-outline px-4 py-2.5 text-xs font-bold uppercase min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              Cancel
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={validateAndNextStep}
              disabled={accounts.length === 0 || (currentStep === 1 && isInsufficientBalance)}
              className="ds-btn-primary px-5 py-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || isOverdraft || accounts.length === 0 || isInsufficientBalance}
              className="ds-btn-primary px-6 py-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              {mutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="h-4 w-4" /> Submit Transaction</>
              )}
            </button>
          )}
        </div>
      </div>

      {showCreateAccountModal && (
        <CreateAccountModal onClose={() => setShowCreateAccountModal(false)} />
      )}
    </div>
    </ModalPortal>
  );
}
