"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { X, Loader2, AlertTriangle, Plus, Tag, Info } from "lucide-react";
import { CategoryIcon, STUDENT_ICONS } from "@/app/(dashboard)/categories/page";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/components/ui/CurrencyDisplay";
import { useToast } from "@/context/ToastContext";

interface CreateTransactionModalProps {
  onClose: () => void;
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

export function CreateTransactionModal({ onClose }: CreateTransactionModalProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const currency = user?.currency || "THB";

  const [description,     setDescription]     = useState("");
  const [amount,          setAmount]          = useState("");
  const [transactionType, setTransactionType] = useState("Expense");
  const [accountId,       setAccountId]       = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [categoryId,      setCategoryId]      = useState("");
  const [date,            setDate]            = useState(new Date().toISOString().split("T")[0]);
  const [selectedTagIds,  setSelectedTagIds]  = useState<string[]>([]);
  const [isRecurring,     setIsRecurring]     = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [showOverdraftModal, setShowOverdraftModal] = useState(false);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#10B981");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Wallet");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [tagError, setTagError] = useState<string | null>(null);

  // Category and Tag Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (body: { name: string; type: string; icon: string; color: string }) => {
      const res = await apiClient.post("/api/transactions/categories", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create category");
    },
    onSuccess: (newCat) => {
      showToast("Category created successfully", "success");
      // Synchronously inject the new category into the cache so the useEffect
      // sees it immediately and doesn't reset the selection
      qc.setQueryData<Category[]>(["categories"], (old) => [...(old || []), newCat]);
      setCategoryId(newCat.id);
      setNewCategoryName("");
      setNewCategoryIcon("Wallet");
      setShowAddCategory(false);
      setCategoryError(null);
    },
    onError: (err: any) => {
      setCategoryError(err.message || "Failed to create category");
    }
  });

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

  // 1. Fetch Accounts
  const { data: accountsData } = useQuery<{ items: Account[] }>({
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
    const filteredCats = categories.filter((c) => c.type === transactionType);
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    } else {
      setCategoryId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType]);

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

    if (transactionType === "Transfer" && !targetAccountId) {
      setError("Please select a target account for transfers.");
      return;
    }

    if (transactionType === "Transfer" && accountId === targetAccountId) {
      setError("Source and target accounts must be different.");
      return;
    }

    if (!date) {
      setError("Please select a valid date.");
      return;
    }

    mutation.mutate({
      accountId,
      targetAccountId:  transactionType === "Transfer" ? targetAccountId : null,
      categoryId:       transactionType !== "Transfer" && categoryId ? categoryId : null,
      transactionType,
      isRecurring,
      date:             new Date(date).toISOString(),
      amount:           parsedAmount,
      description:      description.trim() || null,
      tagIds:           selectedTagIds.length > 0 ? selectedTagIds : null,
    });
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          id="close-create-transaction-modal"
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
            New Transaction
          </div>
          <h2 className="text-lg font-bold tracking-tight">Record Transaction</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Log an income, expense, or local account transfer.
          </p>
        </div>

        {error && (
          <div className="ds-alert-error flex items-start gap-2 p-3 mb-4 text-xs font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form id="create-transaction-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Transaction Type */}
            <div>
              <label htmlFor="tx-type" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Transaction Type
              </label>
              <select
                id="tx-type"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="ds-input w-full px-3 py-2.5 text-sm"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="tx-amount" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Amount ({currency})
              </label>
              <input
                id="tx-amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account (Source) */}
            <div>
              <label htmlFor="tx-account" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                {transactionType === "Transfer" ? "Source Account" : "Account"}
              </label>
              <select
                id="tx-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="ds-input w-full px-3 py-2.5 text-sm"
              >
                <option value="" disabled>Select account...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.balance, currency)})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Account (Transfers Only) */}
            {transactionType === "Transfer" ? (
              <div>
                <label htmlFor="tx-target" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                  Target Account
                </label>
                <select
                  id="tx-target"
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="ds-input w-full px-3 py-2.5 text-sm"
                >
                  <option value="">Select target...</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance, currency)})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Category (Expense/Income only) */
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="tx-category" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono">
                    Category
                  </label>
                  {!showAddCategory && (
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="text-[10px] text-[hsl(var(--primary))] font-bold hover:underline font-mono"
                    >
                      + NEW
                    </button>
                  )}
                </div>

                {showAddCategory ? (
                  <div className="space-y-2 p-3 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg">
                    <div>
                      <input
                        type="text"
                        placeholder="Category Name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="ds-input w-full px-2 py-1 text-xs"
                        autoFocus
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono block mb-1">
                        Icon ({newCategoryIcon})
                      </span>
                      <div className="grid grid-cols-5 gap-1.5 p-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg">
                        {STUDENT_ICONS.map((ico) => {
                          const isSelected = newCategoryIcon === ico.name;
                          return (
                            <button
                              key={ico.name}
                              type="button"
                              onClick={() => setNewCategoryIcon(ico.name)}
                              title={ico.label}
                              className={`h-7 w-7 rounded border flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                                  : "bg-transparent border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-hover))] hover:text-[hsl(var(--foreground))]"
                              }`}
                            >
                              <CategoryIcon name={ico.name} className="h-3.5 w-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 flex gap-2 items-center">
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">Color:</span>
                        <input
                          type="color"
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="h-6 w-6 rounded border border-[hsl(var(--border))] bg-transparent cursor-pointer"
                        />
                      </div>
                      <div className="flex gap-1">
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
                          className="px-2 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] font-bold rounded"
                        >
                          {createCategoryMutation.isPending ? "..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCategory(false);
                            setCategoryError(null);
                          }}
                          className="px-2 py-1 bg-transparent text-[hsl(var(--muted-foreground))] text-[10px] font-bold rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    {categoryError && (
                      <p className="text-[10px] text-[hsl(var(--destructive))] font-mono">
                        {categoryError}
                      </p>
                    )}
                  </div>
                ) : (
                  <select
                    id="tx-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="ds-input w-full px-3 py-2.5 text-sm"
                  >
                    <option value="">None / Uncategorized</option>
                    {categories
                      .filter((c) => c.type === transactionType)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="tx-date" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="tx-description" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Description
              </label>
              <input
                id="tx-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Starbucks, Tuition"
                className="ds-input w-full px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Tags Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono">
                Tags
              </label>
              {!showAddTag && (
                <button
                  type="button"
                  onClick={() => setShowAddTag(true)}
                  className="text-[10px] text-[hsl(var(--primary))] font-bold hover:underline font-mono"
                >
                  + NEW
                </button>
              )}
            </div>

            {showAddTag ? (
              <div className="space-y-2 p-3 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-lg mb-3">
                <div>
                  <input
                    type="text"
                    placeholder="Tag Name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="ds-input w-full px-2 py-1 text-xs"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex gap-2 items-center">
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">Color:</span>
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="h-6 w-6 rounded border border-[hsl(var(--border))] bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newTagName.trim()) return;
                        createTagMutation.mutate({
                          name: newTagName.trim(),
                          color: newTagColor,
                        });
                      }}
                      disabled={createTagMutation.isPending}
                      className="px-2 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[10px] font-bold rounded"
                    >
                      {createTagMutation.isPending ? "..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTag(false);
                        setTagError(null);
                      }}
                      className="px-2 py-1 bg-transparent text-[hsl(var(--muted-foreground))] text-[10px] font-bold rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {tagError && (
                  <p className="text-[10px] text-[hsl(var(--destructive))] font-mono">
                    {tagError}
                  </p>
                )}
              </div>
            ) : null}

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all ${
                        selected
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary)/0.25)]"
                          : "bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]"
                      }`}
                    >
                      <Tag className="h-3 w-3 shrink-0" />
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : !showAddTag ? (
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-mono">
                No tags created yet. Click + NEW to add one.
              </p>
            ) : null}
          </div>

          {/* Recurring Info Block */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.04)] text-xs text-[hsl(var(--foreground))] font-mono">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5 text-[hsl(var(--primary))]" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px] text-[hsl(var(--primary))] mb-0.5">Recurring Schedules Notice</p>
              <p className="opacity-90 leading-normal text-[hsl(var(--muted-foreground))]">
                To set up automated recurring bills, deposits, or subscriptions, please go to the dedicated <a href="/recurring" className="text-[hsl(var(--primary))] font-bold hover:underline">Recurring Schedules</a> section on our website.
              </p>
            </div>
          </div>

          {/* Overdraft Warning */}
          {isOverdraft && (
            <div className="ds-alert-error flex items-start gap-2.5 p-3.5 rounded-xl border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive)/0.06)] text-xs text-[hsl(var(--destructive))] font-mono animate-pulse">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px] mb-1">Overdraft Violation Blocked</p>
                <p className="opacity-90 leading-normal">
                  Your total net balance is {currentNetBalance.toFixed(2)} {currency}. Spending {txAmount.toFixed(2)} {currency} will drop it to {proposedNetBalance.toFixed(2)} {currency}.
                </p>
              </div>
            </div>
          )}

          <button
            id="create-transaction-submit"
            type="submit"
            disabled={mutation.isPending || isOverdraft}
            className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...</>
            ) : (
              <><Plus className="h-3.5 w-3.5" /> Log Transaction</>
            )}
          </button>
        </form>
      </div>

      {showOverdraftModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="ds-card w-full max-w-sm p-6 border-[hsl(var(--destructive)/0.5)] bg-[hsl(var(--card))] shadow-2xl relative text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-[hsl(var(--destructive))]" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-[hsl(var(--destructive))]">
                Overdraft Prevented
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 font-mono leading-relaxed">
                This transaction has been blocked by the system guardrails because it would reduce your total net balance below zero.
              </p>
            </div>
            <button
              onClick={() => setShowOverdraftModal(false)}
              className="w-full ds-btn-primary bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.85)] text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg font-sans"
            >
              Understand & Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
