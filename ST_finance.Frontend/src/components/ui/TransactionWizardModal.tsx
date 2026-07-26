"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { X, Loader2, AlertTriangle, Plus, Tag, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { CategoryIcon, STUDENT_ICONS } from "@/app/(dashboard)/categories/page";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/components/ui/CurrencyDisplay";
import { useToast } from "@/context/ToastContext";
import { CreateAccountModal } from "@/components/ui/CreateAccountModal";

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
}

interface TagType {
  id: string;
  name: string;
}

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

  // Wizard Step State (1: Type & Amount, 2: Account & Category, 3: Details & Review)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

  // Inline Category & Tag Creation states
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>("#10B981");
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>("Wallet");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [showAddTag, setShowAddTag] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>("");
  const [newTagColor, setNewTagColor] = useState<string>("#6B7280");
  const [tagError, setTagError] = useState<string | null>(null);

  // 1. Fetch Accounts
  const { data: accountsData, isLoading: isAccountsLoading } = useQuery<{ items: Account[] }>({
    queryKey: ["accounts", "all"],
    queryFn: async () => {
      const res = await apiClient.get("/api/accounts?pageSize=100");
      return res.data.value || { items: [] };
    },
  });
  const accounts = accountsData?.items || [];

  const currentNetBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const txAmount = parseFloat(amount) || 0;
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
      return res.data.value || [];
    },
  });
  const categories = categoriesData || [];

  // 3. Fetch Tags
  const { data: tagsData } = useQuery<TagType[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await apiClient.get("/api/transactions/tags");
      return res.data.value || [];
    },
  });
  const tags = tagsData || [];

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Set default category when transaction type changes
  useEffect(() => {
    if (initialData?.categoryId) return;
    const filteredCats = categories.filter((c) => c.type === transactionType);
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    } else {
      setCategoryId("");
    }
  }, [transactionType, categories, initialData?.categoryId]);

  // Focus Trapping & Accessibility (Escape Key to close, Tab navigation wrap)
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
          if (document.activeElement === firstEl) {
            lastEl?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl?.focus();
            e.preventDefault();
          }
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
    }
  });

  // Create Tag Mutation
  const createTagMutation = useMutation({
    mutationFn: async (body: { name: string; color: string }) => {
      const res = await apiClient.post("/api/transactions/tags", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create tag");
    },
    onSuccess: (newTag) => {
      showToast("Tag created successfully", "success");
      qc.invalidateQueries({ queryKey: ["tags"] });
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setNewTagName("");
      setShowAddTag(false);
      setTagError(null);
    },
    onError: (err: any) => {
      setTagError(err.message || "Failed to create tag");
    }
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

  // Navigation handlers between Wizard steps
  const validateAndNextStep = () => {
    setError(null);

    if (currentStep === 1) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Please enter a valid amount greater than 0.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!accountId) {
        setError("Please select a source account.");
        return;
      }
      if (transactionType === "Transfer" && !targetAccountId) {
        setError("Please select a target account for transfer.");
        return;
      }
      if (transactionType === "Transfer" && accountId === targetAccountId) {
        setError("Source and Target accounts must be different.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!accountId) {
      setError("Please select a source account.");
      return;
    }

    if (!date) {
      setError("Please select a valid date.");
      return;
    }

    mutation.mutate({
      accountId,
      targetAccountId: transactionType === "Transfer" ? targetAccountId : null,
      categoryId: transactionType !== "Transfer" && categoryId ? categoryId : null,
      transactionType,
      isRecurring,
      date: new Date(date).toISOString(),
      amount: parsedAmount,
      description: description.trim() || null,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : null,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-3 sm:px-4 py-4"
    >
      <div
        ref={modalRef}
        className="ds-card w-full max-w-lg p-5 sm:p-6 relative max-h-[92vh] sm:max-h-[88vh] flex flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl border-[hsl(var(--primary)/0.3)] animate-fadeIn"
      >
        {/* Header with Close Button */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[hsl(var(--border))]">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] font-mono font-bold text-xs">
                {currentStep}/3
              </span>
              <div>
                <h2 id="wizard-modal-title" className="text-base sm:text-lg font-bold tracking-tight">
                  Guided Transaction Setup
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {currentStep === 1 && "Step 1: Set Type & Amount"}
                  {currentStep === 2 && "Step 2: Choose Accounts & Category"}
                  {currentStep === 3 && "Step 3: Review, Notes & Tags"}
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

          {/* Accessible Step Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-label={`Step ${currentStep} of 3`}
            className="w-full bg-[hsl(var(--secondary))] h-1.5 rounded-full my-4 overflow-hidden"
          >
            <div
              className="bg-[hsl(var(--primary))] h-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>

          {/* ARIA Live Region for Step Announcements & Validation Errors */}
          <div aria-live="assertive" className="sr-only">
            Step {currentStep} of 3: {currentStep === 1 ? "Type and Amount" : currentStep === 2 ? "Accounts and Category" : "Review and Details"}. {error || ""}
          </div>

          {error && (
            <div role="alert" className="ds-alert-error flex items-start gap-2 p-3 mb-4 text-xs font-mono rounded-lg">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {!isAccountsLoading && accounts.length === 0 && (
            <div role="alert" className="p-4 rounded-xl border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)] text-xs text-[hsl(var(--foreground))] space-y-3 font-mono my-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-[hsl(var(--warning))] mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-[hsl(var(--warning))]">
                    No Accounts Found
                  </p>
                  <p className="mt-1 leading-relaxed text-[hsl(var(--muted-foreground))] font-sans">
                    No accounts created yet. You need at least one wallet account before creating transactions.{" "}
                    <button
                      type="button"
                      onClick={() => setShowCreateAccountModal(true)}
                      className="text-[hsl(var(--primary))] font-bold underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-1 font-sans"
                    >
                      Create a new one here
                    </button>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-[hsl(var(--border))] font-sans">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(true)}
                  className="ds-btn-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 min-h-[44px]"
                >
                  <Plus className="h-4 w-4" /> + Create Account Now
                </button>
                <a
                  href="/accounts"
                  className="ds-btn-outline px-3 py-2 text-xs font-mono min-h-[44px] flex items-center justify-center"
                >
                  Go to Wallets Page
                </a>
              </div>
            </div>
          )}

          {/* STEP 1: Type & Amount */}
          {currentStep === 1 && (
            <div className="space-y-5 py-2">
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
                  1. Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Expense", "Income", "Transfer"].map((t) => {
                    const isSelected = transactionType === t;
                    return (
                      <button
                        key={t}
                        type="button"
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
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="ds-input w-full pl-16 pr-4 py-3 text-2xl font-mono font-black min-h-[52px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Accounts & Category */}
          {currentStep === 2 && (
            <div className="space-y-4 py-2">
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

                {transactionType === "Transfer" ? (
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
                ) : null}
              </div>

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
                        className="text-xs text-[hsl(var(--primary))] font-bold hover:underline font-mono min-h-[44px] sm:min-h-[32px] px-2"
                      >
                        + NEW CATEGORY
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
                          className="ds-btn-primary px-3 py-1.5 text-xs"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCategory(false)}
                          className="px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {categories
                        .filter((c) => c.type === transactionType)
                        .map((c) => {
                          const isSelected = categoryId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCategoryId(c.id)}
                              className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all min-h-[48px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                                isSelected
                                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] font-bold"
                                  : "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--border-hover))]"
                              }`}
                            >
                              <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
                              <span className="text-xs truncate">{c.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Details, Date, Tags & Confirmation */}
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
                    placeholder="e.g. Starbucks, Tuition"
                    className="ds-input w-full px-3 py-2.5 text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                  {tags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setSelectedTagIds((prev) =>
                            prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                          )
                        }
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-full border text-xs font-mono transition-all min-h-[44px] sm:min-h-[36px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] ${
                          selected
                            ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                            : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]"
                        }`}
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overdraft Alert Warning */}
              {isOverdraft && (
                <div role="alert" className="ds-alert-error p-3.5 rounded-xl border border-[hsl(var(--destructive)/0.3)] bg-[hsl(var(--destructive)/0.08)] text-xs text-[hsl(var(--destructive))] font-mono">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[10px]">Overdraft Prevention Block</p>
                      <p className="mt-1 leading-relaxed">
                        Total net balance is {currentNetBalance.toFixed(2)} {currency}. Logging {txAmount.toFixed(2)} {currency} expense will exceed your balance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
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

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={validateAndNextStep}
              disabled={accounts.length === 0}
              className="ds-btn-primary px-5 py-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || isOverdraft || accounts.length === 0}
              className="ds-btn-primary px-6 py-2.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Log Transaction
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showCreateAccountModal && (
        <CreateAccountModal onClose={() => setShowCreateAccountModal(false)} />
      )}
    </div>
  );
}
