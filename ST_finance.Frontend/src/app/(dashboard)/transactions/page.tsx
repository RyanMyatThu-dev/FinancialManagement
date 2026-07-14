"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { TimeframeFilter, type Timeframe } from "@/components/ui/TimeframeFilter";
import { Pagination, type PaginationMeta } from "@/components/ui/Pagination";
import { CreateTransactionModal } from "@/components/ui/CreateTransactionModal";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
  Search,
  Plus,
  X,
  DollarSign,
  Tag,
  FolderOpen,
} from "lucide-react";

interface Transaction {
  id:              string;
  description?:   string;
  amount:          number;
  transactionType: string;
  categoryId?:     string;
  date:            string;
  accountId:       string;
}

interface PagedTransactionResponse {
  items:           Transaction[];
  pageNumber:      number;
  pageSize:        number;
  totalCount:      number;
  totalPages:      number;
  hasPreviousPage: boolean;
  hasNextPage:     boolean;
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

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("Month");
  const [page,      setPage]      = useState(1);

  // Active query parameter states (used to fetch data via useQuery)
  const [search,          setSearch]          = useState("");
  const [categoryId,      setCategoryId]      = useState("");
  const [tagId,           setTagId]           = useState("");
  const [minAmount,       setMinAmount]       = useState("");
  const [maxAmount,       setMaxAmount]       = useState("");

  // Temporary draft input states (updated on keystrokes/selections, applied on Search click)
  const [tempSearch,      setTempSearch]      = useState("");
  const [tempCategoryId,  setTempCategoryId]  = useState("");
  const [tempTagId,       setTempTagId]       = useState("");
  const [tempMinAmount,   setTempMinAmount]   = useState("");
  const [tempMaxAmount,   setTempMaxAmount]   = useState("");

  const [showFilters,     setShowFilters]     = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currency = user?.currency || "THB";

  // Reset to page 1 whenever timeframe changes
  const handleTimeframe = (tf: Timeframe) => {
    setTimeframe(tf);
    setPage(1);
  };

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearch(tempSearch);
    setCategoryId(tempCategoryId);
    setTagId(tempTagId);
    setMinAmount(tempMinAmount);
    setMaxAmount(tempMaxAmount);
    setPage(1);
  };

  const resetFilters = () => {
    setTempSearch("");
    setTempCategoryId("");
    setTempTagId("");
    setTempMinAmount("");
    setTempMaxAmount("");

    setSearch("");
    setCategoryId("");
    setTagId("");
    setMinAmount("");
    setMaxAmount("");
    setPage(1);
  };

  // 1. Fetch Transactions (with server-side filters & description search)
  const { data, isLoading, error } = useQuery<PagedTransactionResponse>({
    queryKey: ["transactions", timeframe, page, search, categoryId, tagId, minAmount, maxAmount],
    queryFn: async () => {
      let url = `/api/transactions?pageNumber=${page}&pageSize=${PAGE_SIZE}&timeframe=${timeframe}`;
      if (search)     url += `&search=${encodeURIComponent(search)}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (tagId)      url += `&tagId=${tagId}`;
      if (minAmount)  url += `&minAmount=${minAmount}`;
      if (maxAmount)  url += `&maxAmount=${maxAmount}`;

      const res = await apiClient.get(url);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch transactions");
    },
    placeholderData: (prev) => prev,
  });

  // 2. Fetch Categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await apiClient.get("/api/transactions/categories");
      return res.data.value || [];
    },
  });

  // 3. Fetch Tags
  const { data: tags } = useQuery<TagType[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await apiClient.get("/api/transactions/tags");
      return res.data.value || [];
    },
  });

  // 4. Fetch Summary Metrics (unpaginated total for the current filters)
  const { data: summaryData } = useQuery<{ inflow: number; outflow: number }>({
    queryKey: ["transactions", "summary", timeframe, search, categoryId, tagId, minAmount, maxAmount],
    queryFn: async () => {
      let url = `/api/transactions/summary?timeframe=${timeframe}`;
      if (search)     url += `&search=${encodeURIComponent(search)}`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      if (tagId)      url += `&tagId=${tagId}`;
      if (minAmount)  url += `&minAmount=${minAmount}`;
      if (maxAmount)  url += `&maxAmount=${maxAmount}`;

      const res = await apiClient.get(url);
      if (res.data.isSuccess && res.data.value) {
        return res.data.value;
      }
      return { inflow: 0, outflow: 0 };
    },
  });

  const transactions = data?.items ?? [];

  const totalIncome  = summaryData?.inflow ?? 0;
  const totalExpense = summaryData?.outflow ?? 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
    });

  const meta: PaginationMeta | null = data
    ? {
        pageNumber:      data.pageNumber,
        pageSize:        data.pageSize,
        totalCount:      data.totalCount,
        totalPages:      data.totalPages,
        hasPreviousPage: data.hasPreviousPage,
        hasNextPage:     data.hasNextPage,
      }
    : null;

  const hasActiveFilters = categoryId || tagId || minAmount || maxAmount || search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Transactions Ledger</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Full history log of your daily earnings and expense transactions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex justify-start sm:justify-end">
            <TimeframeFilter value={timeframe} onChange={handleTimeframe} />
          </div>
          <button
            id="add-transaction-btn"
            onClick={() => setShowCreateModal(true)}
            className="ds-btn-primary px-4 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Quick Summary Tiles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Period Inflow ({timeframe})
            </span>
          </div>
          <p className="font-mono tabular-nums font-bold text-lg text-[hsl(var(--primary))]">
            +{formatAmount(totalIncome)}
            <span className="text-[10px] ml-1 opacity-60">{currency}</span>
          </p>
        </div>
        <div className="ds-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-[hsl(var(--destructive))]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Period Outflow ({timeframe})
            </span>
          </div>
          <p className="font-mono tabular-nums font-bold text-lg text-[hsl(var(--destructive))]">
            -{formatAmount(totalExpense)}
            <span className="text-[10px] ml-1 opacity-60">{currency}</span>
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleApplyFilters} className="ds-card p-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              id="transactions-search"
              type="text"
              placeholder="Search description..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="ds-input w-full pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-none ds-btn-primary px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider h-[38px] shrink-0"
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </button>
            <button
              id="transactions-filter-btn"
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`ds-btn-icon h-[38px] w-[38px] relative shrink-0 ${
                showFilters || hasActiveFilters ? "text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--primary)/0.05)]" : ""
              }`}
              title="Toggle Advanced Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_8px_hsl(var(--primary))]" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFilters && (
          <div className="border-t border-[hsl(var(--border))] pt-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            {/* Category Filter */}
            <div>
              <label htmlFor="filter-category" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <FolderOpen className="h-3 w-3" /> Category
              </label>
              <select
                id="filter-category"
                value={tempCategoryId}
                onChange={(e) => setTempCategoryId(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="">All Categories</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label htmlFor="filter-tag" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <Tag className="h-3 w-3" /> Tag
              </label>
              <select
                id="filter-tag"
                value={tempTagId}
                onChange={(e) => setTempTagId(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="">All Tags</option>
                {tags?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Ranged: Min Amount */}
            <div>
              <label htmlFor="filter-min-amount" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <DollarSign className="h-3 w-3" /> Min Price
              </label>
              <input
                id="filter-min-amount"
                type="number"
                placeholder="Min amount"
                value={tempMinAmount}
                onChange={(e) => setTempMinAmount(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            {/* Price Ranged: Max Amount & Action Buttons */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label htmlFor="filter-max-amount" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                  <DollarSign className="h-3 w-3" /> Max Price
                </label>
                <input
                  id="filter-max-amount"
                  type="number"
                  placeholder="Max amount"
                  value={tempMaxAmount}
                  onChange={(e) => setTempMaxAmount(e.target.value)}
                  className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="ds-btn-primary px-3.5 py-1.5 h-[32px] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 shrink-0"
              >
                Apply
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ds-btn-outline px-2.5 py-1.5 h-[32px] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.25)] hover:bg-[hsl(var(--destructive)/0.05)] shrink-0"
                  title="Reset Filters"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Table */}
      <div className="sm:border sm:border-[hsl(var(--border))] sm:bg-[hsl(var(--card))] sm:rounded-xl bg-transparent border-0 rounded-none overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_80px_110px] sm:grid-cols-[50px_1fr_120px_80px_130px] px-5 py-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.4)]">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            No.
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
            Description
          </span>
          <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-center">
            Date
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-center">
            Type
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-right">
            Amount
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-[hsl(var(--primary))]" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ds-alert-error flex items-center gap-2.5 p-4 m-4 text-sm font-mono">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>{(error as Error).message}</p>
          </div>
        )}

        {/* Rows */}
        {transactions.map((tx, idx) => (
          <div
            key={tx.id ?? `tx-${idx}`}
            className={`ds-table-row grid grid-cols-[40px_1fr_80px_110px] sm:grid-cols-[50px_1fr_120px_80px_130px] px-5 py-3.5 items-center ${
              idx !== 0 ? "border-t border-[hsl(var(--border))]" : ""
            }`}
          >
            {/* Number index */}
            <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
              {(page - 1) * PAGE_SIZE + idx + 1}
            </span>

            {/* Description */}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {tx.description || <span className="text-[hsl(var(--muted-foreground))] italic text-xs font-mono">No description</span>}
              </p>
              <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] mt-0.5">
                {formatDate(tx.date)}
              </p>
            </div>

            {/* Date (desktop) */}
            <div className="hidden sm:flex justify-center">
              <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                {formatDate(tx.date)}
              </span>
            </div>

            {/* Type badge */}
            <div className="flex justify-center">
              {tx.transactionType === "Income" ? (
                <span className="ds-badge ds-badge-success">+IN</span>
              ) : tx.transactionType === "Transfer" ? (
                <span className="ds-badge border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] font-mono">↔ TR</span>
              ) : (
                <span className="ds-badge ds-badge-danger">−OUT</span>
              )}
            </div>

            {/* Amount */}
            <p
              className={`text-right font-mono tabular-nums font-semibold text-sm ${
                tx.transactionType === "Income"
                  ? "text-[hsl(var(--primary))]"
                  : tx.transactionType === "Transfer"
                  ? "text-[hsl(var(--muted-foreground))]"
                  : "text-[hsl(var(--destructive))]"
              }`}
            >
              {tx.transactionType === "Income" ? "+" : tx.transactionType === "Transfer" ? "↔" : "−"}
              {formatAmount(tx.amount)}
              <span className="text-[9px] ml-1 opacity-50">{currency}</span>
            </p>
          </div>
        ))}

        {/* Empty */}
        {!isLoading && !error && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))] font-mono text-center">
            <p className="text-sm font-bold text-[hsl(var(--foreground))]">No transactions found</p>
            <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Pagination inside table card */}
        {meta && meta.totalPages > 1 && (
          <div className="border-t border-[hsl(var(--border))] px-5 py-4">
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        )}
      </div>

      {showCreateModal && <CreateTransactionModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
