"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { X, Loader2, AlertTriangle, Plus } from "lucide-react";
import { CategoryIcon, STUDENT_ICONS } from "@/app/(dashboard)/categories/page";

interface CreateRecurringModalProps {
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

export function CreateRecurringModal({ onClose }: CreateRecurringModalProps) {
  const qc = useQueryClient();

  const [name,            setName]            = useState("");
  const [amount,          setAmount]          = useState("");
  const [transactionType, setTransactionType] = useState("Expense");
  const [accountId,       setAccountId]       = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [categoryId,      setCategoryId]      = useState("");
  const [frequency,       setFrequency]       = useState("Monthly");
  const [startDate,       setStartDate]       = useState(new Date().toISOString().split("T")[0]);
  const [endDate,         setEndDate]         = useState("");
  const [error,           setError]           = useState<string | null>(null);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#10B981");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Wallet");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Category Mutation
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

  // Set default account
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
      const res = await apiClient.post("/api/recurring", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create recurring schedule.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
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
      targetAccountId:    transactionType === "Transfer" ? targetAccountId : null,
      categoryId:         transactionType !== "Transfer" && categoryId ? categoryId : null,
      name:               name.trim(),
      amount:             parseFloat(amount) || 0,
      transactionType,
      frequency,
      startDate:          new Date(startDate).toISOString(),
      endDate:            endDate ? new Date(endDate).toISOString() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button
          id="close-create-recurring-modal"
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
            Recurring Bill
          </div>
          <h2 className="text-lg font-bold tracking-tight">Create Recurring Schedule</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Set up automated income, bill payments, or subscription charges.
          </p>
        </div>

        {error && (
          <div className="ds-alert-error flex items-start gap-2 p-3 mb-4 text-xs font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form id="create-recurring-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Schedule Name */}
          <div>
            <label htmlFor="rec-name" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Schedule Name / Purpose
            </label>
            <input
              id="rec-name"
              type="text"
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly Rent, Salary Deposit, Netflix Sub"
              className="ds-input w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Transaction Type */}
            <div>
              <label htmlFor="rec-type" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Type
              </label>
              <select
                id="rec-type"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="ds-input w-full px-3 py-2.5 text-sm"
              >
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>

            {/* Frequency */}
            <div>
              <label htmlFor="rec-frequency" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Frequency
              </label>
              <select
                id="rec-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="ds-input w-full px-3 py-2.5 text-sm"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="rec-amount" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Amount (THB)
              </label>
              <input
                id="rec-amount"
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
              <label htmlFor="rec-account" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                {transactionType === "Transfer" ? "Source Account" : "Account"}
              </label>
              <select
                id="rec-account"
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

            {/* Target Account (Transfers) or Category (Other) */}
            {transactionType === "Transfer" ? (
              <div>
                <label htmlFor="rec-target" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                  Target Account
                </label>
                <select
                  id="rec-target"
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
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="rec-category" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono">
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
                    id="rec-category"
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
            {/* Start Date */}
            <div>
              <label htmlFor="rec-start" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Start Date
              </label>
              <input
                id="rec-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>

            {/* End Date (Optional) */}
            <div>
              <label htmlFor="rec-end" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                End Date <span className="normal-case font-normal opacity-60">(optional)</span>
              </label>
              <input
                id="rec-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              />
            </div>
          </div>

          <button
            id="create-recurring-submit"
            type="submit"
            disabled={mutation.isPending}
            className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scheduling...</>
            ) : (
              <><Plus className="h-3.5 w-3.5" /> Setup Recurring</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
