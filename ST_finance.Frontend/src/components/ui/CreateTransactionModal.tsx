"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { X, Loader2, AlertTriangle, Plus, Tag } from "lucide-react";

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
  const qc = useQueryClient();

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
    mutationFn: async () => {
      const res = await apiClient.post("/api/transactions/categories", {
        name: newCategoryName,
        type: transactionType,
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create category");
    },
    onSuccess: (newCat) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setCategoryId(newCat.id);
      setNewCategoryName("");
      setShowAddCategory(false);
      setCategoryError(null);
    },
    onError: (err: any) => {
      setCategoryError(err.message || "Failed to create category");
    }
  });

  const createTagMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/transactions/tags", {
        name: newTagName,
        color: newTagColor,
      });
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create tag");
    },
    onSuccess: (newTag) => {
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
    queryKey: ["accounts-all"],
    queryFn: async () => {
      const res = await apiClient.get("/api/accounts?pageSize=100");
      return res.data.value || { items: [] };
    },
  });
  const accounts = accountsData?.items || [];

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

  // Set default category when categories load (filtered by type)
  useEffect(() => {
    const filteredCats = categories.filter((c) => c.type === transactionType);
    if (filteredCats.length > 0) {
      setCategoryId(filteredCats[0].id);
    } else {
      setCategoryId("");
    }
  }, [categories, transactionType]);

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await apiClient.post("/api/transactions", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to add transaction.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboardSummary"] });
      qc.invalidateQueries({ queryKey: ["dashboardTrends"] });
      qc.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    mutation.mutate({
      accountId,
      targetAccountId:  transactionType === "Transfer" ? targetAccountId : null,
      categoryId:       transactionType !== "Transfer" && categoryId ? categoryId : null,
      transactionType,
      isRecurring,
      date:             new Date(date).toISOString(),
      amount:           parseFloat(amount) || 0,
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
                Amount (THB)
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
                    {a.name} (฿{a.balance.toLocaleString()})
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
                      {a.name} (฿{a.balance.toLocaleString()})
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
                            createCategoryMutation.mutate();
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
                        createTagMutation.mutate();
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

          {/* Is Recurring Checkbox */}
          <div className="flex items-center gap-2.5 py-1.5">
            <input
              id="tx-recurring"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))] cursor-pointer"
            />
            <label htmlFor="tx-recurring" className="text-xs font-mono text-[hsl(var(--muted-foreground))] cursor-pointer select-none">
              Mark as Recurring (triggers automated quota logic)
            </label>
          </div>

          <button
            id="create-transaction-submit"
            type="submit"
            disabled={mutation.isPending}
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
    </div>
  );
}
