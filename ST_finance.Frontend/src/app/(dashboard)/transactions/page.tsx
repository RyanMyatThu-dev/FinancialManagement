"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Calendar,
  Wallet,
  Clock,
} from "lucide-react";

interface Transaction {
  id:              string;
  description?:   string;
  amount:          number;
  transactionType: string;
  categoryId?:     string;
  date:            string;
  accountId:       string;
  targetAccountId?: string;
  createdAt:       string;
  tagNames?:       string[];
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
  const searchParams = useSearchParams();
  const urlAccountId = searchParams.get("accountId") || "";

  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("Month");
  const [page,      setPage]      = useState(1);

  // Active query parameter states (used to fetch data via useQuery)
  const [search,          setSearch]          = useState("");
  const [categoryId,      setCategoryId]      = useState("");
  const [tagId,           setTagId]           = useState("");
  const [minAmount,       setMinAmount]       = useState("");
  const [maxAmount,       setMaxAmount]       = useState("");
  const [accountIdFilter, setAccountIdFilter] = useState(urlAccountId);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Temporary draft input states (updated on keystrokes/selections, applied on Search click)
  const [tempSearch,          setTempSearch]          = useState("");
  const [tempCategoryId,      setTempCategoryId]      = useState("");
  const [tempTagId,           setTempTagId]           = useState("");
  const [tempMinAmount,       setTempMinAmount]       = useState("");
  const [tempMaxAmount,       setTempMaxAmount]       = useState("");
  const [tempSourceAccountId, setTempSourceAccountId] = useState("");
  const [tempTargetAccountId, setTempTargetAccountId] = useState("");
  const [tempStartDate,       setTempStartDate]       = useState("");
  const [tempEndDate,         setTempEndDate]         = useState("");
  const [tempTransactionType, setTempTransactionType] = useState("");

  const [showFilters,     setShowFilters]     = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const currency = user?.currency || "THB";

  // Sync urlAccountId when search params update
  useEffect(() => {
    setAccountIdFilter(urlAccountId);
    setPage(1);
  }, [urlAccountId]);

  // Reset to page 1 whenever timeframe changes
  const handleTimeframe = (tf: Timeframe) => {
    setTimeframe(tf);
    if (tf !== "Custom") {
      setStartDate("");
      setEndDate("");
      setTempStartDate("");
      setTempEndDate("");
    }
    setPage(1);
  };

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearch(tempSearch);
    setCategoryId(tempCategoryId);
    setTagId(tempTagId);
    setMinAmount(tempMinAmount);
    setMaxAmount(tempMaxAmount);
    setSourceAccountId(tempSourceAccountId);
    setTargetAccountId(tempTargetAccountId);
    setTransactionType(tempTransactionType);

    const hasCustomDates = tempStartDate || tempEndDate;
    if (hasCustomDates) {
      setTimeframe("Custom");
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
    } else {
      setStartDate("");
      setEndDate("");
    }

    setPage(1);
  };

  const resetFilters = () => {
    setTempSearch("");
    setTempCategoryId("");
    setTempTagId("");
    setTempMinAmount("");
    setTempMaxAmount("");
    setTempSourceAccountId("");
    setTempTargetAccountId("");
    setTempStartDate("");
    setTempEndDate("");
    setTempTransactionType("");

    setSearch("");
    setCategoryId("");
    setTagId("");
    setMinAmount("");
    setMaxAmount("");
    setAccountIdFilter("");
    setSourceAccountId("");
    setTargetAccountId("");
    setStartDate("");
    setEndDate("");
    setTransactionType("");
    setTimeframe("Month");
    setPage(1);
  };

  // Fetch Accounts list to map Account IDs to Names
  const { data: accountsList } = useQuery<any[]>({
    queryKey: ["accounts", "lookup"],
    queryFn: async () => {
      const res = await apiClient.get("/api/accounts?pageSize=100");
      return res.data.value?.items || [];
    },
  });

  // 1. Fetch Transactions (with server-side filters & description search)
  const { data, isLoading, error } = useQuery<PagedTransactionResponse>({
    queryKey: ["transactions", timeframe, page, search, categoryId, tagId, minAmount, maxAmount, accountIdFilter, sourceAccountId, targetAccountId, startDate, endDate, transactionType],
    queryFn: async () => {
      const payload = {
        pageNumber: page,
        pageSize: PAGE_SIZE,
        categoryId: categoryId || null,
        tagId: tagId || null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        search: search || null,
        timeframe: timeframe || null,
        accountId: accountIdFilter || null,
        sourceAccountId: sourceAccountId || null,
        targetAccountId: targetAccountId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        transactionType: transactionType || null,
      };
      const res = await apiClient.post("/api/transactions/search", payload);
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
    queryKey: ["transactions", "summary", timeframe, search, categoryId, tagId, minAmount, maxAmount, accountIdFilter, sourceAccountId, targetAccountId, startDate, endDate, transactionType],
    queryFn: async () => {
      const payload = {
        categoryId: categoryId || null,
        tagId: tagId || null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
        search: search || null,
        timeframe: timeframe || null,
        accountId: accountIdFilter || null,
        sourceAccountId: sourceAccountId || null,
        targetAccountId: targetAccountId || null,
        startDate: startDate || null,
        endDate: endDate || null,
        transactionType: transactionType || null,
      };
      const res = await apiClient.post("/api/transactions/summary-search", payload);
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

  const hasActiveFilters = categoryId || tagId || minAmount || maxAmount || search || accountIdFilter || sourceAccountId || targetAccountId || startDate || endDate || transactionType || timeframe === "Custom";

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
      <form onSubmit={handleApplyFilters} className="ds-card p-3 flex flex-col gap-3" autoComplete="off">
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
              autoComplete="off"
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
          <div className="border-t border-[hsl(var(--border))] pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
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

            {/* Transaction Type Filter */}
            <div>
              <label htmlFor="filter-tx-type" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <ArrowDownLeft className="h-3 w-3" /> Transaction Type
              </label>
              <select
                id="filter-tx-type"
                value={tempTransactionType}
                onChange={(e) => setTempTransactionType(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="">All Types</option>
                <option value="Income">Income (+IN)</option>
                <option value="Expense">Expense (-OUT)</option>
                <option value="Transfer">Transfer (TR)</option>
              </select>
            </div>

            {/* Source Account Filter */}
            <div>
              <label htmlFor="filter-source-account" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <Wallet className="h-3 w-3" /> Source Account
              </label>
              <select
                id="filter-source-account"
                value={tempSourceAccountId}
                onChange={(e) => setTempSourceAccountId(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="">All Accounts</option>
                {accountsList?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Account Filter */}
            <div>
              <label htmlFor="filter-target-account" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <Wallet className="h-3 w-3" /> Target Account
              </label>
              <select
                id="filter-target-account"
                value={tempTargetAccountId}
                onChange={(e) => setTempTargetAccountId(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
              >
                <option value="">All Accounts</option>
                {accountsList?.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
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
                autoComplete="off"
              />
            </div>

            {/* Price Ranged: Max Amount */}
            <div>
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
                autoComplete="off"
              />
            </div>

            {/* Date Ranged: Start Date */}
            <div>
              <label htmlFor="filter-start-date" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <Calendar className="h-3 w-3" /> Start Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
                autoComplete="off"
              />
            </div>

            {/* Date Ranged: End Date */}
            <div>
              <label htmlFor="filter-end-date" className="flex items-center gap-1 text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                <Calendar className="h-3 w-3" /> End Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                className="ds-input w-full px-2.5 py-1.5 text-xs font-mono"
                autoComplete="off"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="col-span-1 sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-[hsl(var(--border))/0.4]">
              <button
                type="submit"
                className="ds-btn-primary px-5 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ds-btn-outline px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.25)] hover:bg-[hsl(var(--destructive)/0.05)]"
                  title="Reset Filters"
                >
                  <X className="h-4 w-4" /> Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Active Account Filter Badge */}
      {accountIdFilter && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-[hsl(var(--primary)/0.18)] bg-[hsl(var(--primary)/0.06)] text-xs font-sans text-[hsl(var(--primary))] shadow-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0" />
            <span>
              Showing transaction history for account:{" "}
              <strong>
                {accountsList?.find((a) => a.id === accountIdFilter)?.name || "Loading..."}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAccountIdFilter("");
              setPage(1);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[hsl(var(--primary)/0.25)] hover:bg-[hsl(var(--primary)/0.1)] transition-colors text-[10px] font-mono uppercase font-bold"
          >
            <X className="h-3 w-3" /> Clear Filter
          </button>
        </div>
      )}

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
            className={`ds-table-row grid grid-cols-[40px_1fr_80px_110px] sm:grid-cols-[50px_1fr_120px_80px_130px] px-5 py-3.5 items-center cursor-pointer ${
              idx !== 0 ? "border-t border-[hsl(var(--border))]" : ""
            }`}
            onClick={() => setSelectedTransaction(tx)}
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
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          accounts={accountsList || []}
          categories={categories || []}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}

/** Transaction Details Modal */
function TransactionDetailsModal({
  transaction,
  accounts,
  categories,
  onClose,
}: {
  transaction: Transaction;
  accounts: any[];
  categories: Category[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const currency = user?.currency || "THB";

  const getAccountName = (id: string) => {
    return accounts.find((a) => a.id === id)?.name || "Unknown Wallet";
  };

  const getCategoryName = (id?: string) => {
    if (!id) return "Uncategorized";
    return categories.find((c) => c.id === id)?.name || "Unknown Category";
  };

  const isIncome = transaction.transactionType === "Income";
  const isTransfer = transaction.transactionType === "Transfer";

  const amountColor = isIncome
    ? "text-[hsl(var(--primary))]"
    : isTransfer
    ? "text-[hsl(var(--muted-foreground))]"
    : "text-[hsl(var(--destructive))]";

  const sign = isIncome ? "+" : isTransfer ? "↔" : "−";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            {isIncome ? (
              <span className="ds-badge ds-badge-success">+ INFLOW</span>
            ) : isTransfer ? (
              <span className="ds-badge border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]">↔ TRANSFER</span>
            ) : (
              <span className="ds-badge ds-badge-danger">− OUTFLOW</span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight">Transaction Details</h2>
        </div>

        <div className="space-y-4 font-sans text-xs">
          {/* Amount block */}
          <div className="bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] rounded-xl p-4 flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1 font-mono">
              Amount
            </span>
            <p className={`font-mono text-2xl font-black ${amountColor}`}>
              {sign} {transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}
            </p>
          </div>

          {/* Description Block */}
          {transaction.description && (
            <div className="border border-[hsl(var(--border))] rounded-xl p-4">
              <span className="block text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
                Description / Notes
              </span>
              <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap break-words leading-relaxed font-sans">
                {transaction.description}
              </p>
            </div>
          )}

          {/* Details list */}
          <div className="border border-[hsl(var(--border))] rounded-xl p-4 space-y-3 font-mono text-[hsl(var(--muted-foreground))]">
            <div className="flex justify-between items-center">
              <span>Source Account:</span>
              <span className="text-[hsl(var(--foreground))] font-semibold">
                {getAccountName(transaction.accountId)}
              </span>
            </div>

            {isTransfer && transaction.targetAccountId && (
              <div className="flex justify-between items-center">
                <span>Target Account:</span>
                <span className="text-[hsl(var(--foreground))] font-semibold">
                  {getAccountName(transaction.targetAccountId)}
                </span>
              </div>
            )}

            {!isTransfer && (
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Category:
                </span>
                <span className="text-[hsl(var(--foreground))] font-semibold">
                  {getCategoryName(transaction.categoryId)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Transaction Date:
              </span>
              <span className="text-[hsl(var(--foreground))] font-semibold">
                {new Date(transaction.date).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Logged Timestamp:
              </span>
              <span className="text-[hsl(var(--foreground))] font-semibold">
                {new Date(transaction.createdAt).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Tags List */}
          {transaction.tagNames && transaction.tagNames.length > 0 && (
            <div className="border border-[hsl(var(--border))] rounded-xl p-4">
              <span className="block text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {transaction.tagNames.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold text-[hsl(var(--muted-foreground))]"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
