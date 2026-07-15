"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Pagination, type PaginationMeta } from "@/components/ui/Pagination";
import { Wallet, CreditCard, PiggyBank, TrendingUp, Loader2, AlertTriangle, Plus, LayoutGrid, List, Search, X, Calendar, Clock } from "lucide-react";
import { CreateAccountModal } from "@/components/ui/CreateAccountModal";

interface Account {
  id: string;
  name: string;
  accountType: string;
  balance: number;
  currency?: string;
  createdAt: string;
}

interface PagedAccountResponse {
  items:           Account[];
  pageNumber:      number;
  pageSize:        number;
  totalCount:      number;
  totalPages:      number;
  hasPreviousPage: boolean;
  hasNextPage:     boolean;
}

const PAGE_SIZE = 12;

const ACCOUNT_ICONS: Record<string, React.ReactNode> = {
  "1":         <Wallet      className="h-5 w-5" />,
  "2":         <CreditCard  className="h-5 w-5" />,
  "3":         <CreditCard  className="h-5 w-5" />,
  "4":         <PiggyBank   className="h-5 w-5" />,
  "5":         <PiggyBank   className="h-5 w-5" />,
  "6":         <CreditCard  className="h-5 w-5" />,
  Bank:        <Wallet      className="h-5 w-5" />,
  EWallet:     <CreditCard  className="h-5 w-5" />,
  TransitCard: <CreditCard  className="h-5 w-5" />,
  Cash:        <PiggyBank   className="h-5 w-5" />,
  Savings:     <PiggyBank   className="h-5 w-5" />,
  Credit:      <CreditCard  className="h-5 w-5" />,
  default:     <TrendingUp  className="h-5 w-5" />,
};

const ACCOUNT_COLORS: Record<string, string> = {
  "1":         "text-[hsl(var(--primary))]         bg-[hsl(var(--primary)/0.1)]         border-[hsl(var(--primary)/0.25)]",
  "2":         "text-[hsl(var(--safe-to-spend))]   bg-[hsl(var(--safe-to-spend)/0.1)]   border-[hsl(var(--safe-to-spend)/0.25)]",
  "3":         "text-[hsl(var(--chula-pink))]      bg-[hsl(var(--chula-pink)/0.1)]      border-[hsl(var(--chula-pink)/0.25)]",
  "4":         "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]           border-[hsl(var(--border))]",
  "5":         "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]           border-[hsl(var(--border))]",
  "6":         "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]           border-[hsl(var(--border))]",
  Bank:        "text-[hsl(var(--primary))]         bg-[hsl(var(--primary)/0.1)]         border-[hsl(var(--primary)/0.25)]",
  EWallet:     "text-[hsl(var(--safe-to-spend))]   bg-[hsl(var(--safe-to-spend)/0.1)]   border-[hsl(var(--safe-to-spend)/0.25)]",
  TransitCard: "text-[hsl(var(--chula-pink))]      bg-[hsl(var(--chula-pink)/0.1)]      border-[hsl(var(--chula-pink)/0.25)]",
  Cash:        "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]           border-[hsl(var(--border))]",
  default:     "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]           border-[hsl(var(--border))]",
};

const getAccountTypeLabel = (type: any): string => {
  switch (String(type)) {
    case "1":
    case "Bank":
      return "Bank";
    case "2":
    case "EWallet":
      return "E-Wallet";
    case "3":
    case "TransitCard":
      return "Transit Card";
    case "4":
    case "Cash":
      return "Cash";
    case "5":
    case "Savings":
      return "Savings";
    case "6":
    case "Credit":
      return "Credit";
    default:
      return String(type);
  }
};

export default function AccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState("");
  const [tempSearch, setTempSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("NameAsc");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data, isLoading, error } = useQuery<PagedAccountResponse>({
    queryKey: ["accounts", page, search, typeFilter, sortBy],
    queryFn: async () => {
      let url = `/api/accounts?pageNumber=${page}&pageSize=${PAGE_SIZE}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (typeFilter) url += `&type=${typeFilter}`;
      if (sortBy) url += `&sortBy=${sortBy}`;

      const res = await apiClient.get(url);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch accounts");
    },
    placeholderData: (prev) => prev,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(tempSearch);
    setPage(1);
  };

  const handleResetFilters = () => {
    setTempSearch("");
    setSearch("");
    setTypeFilter("");
    setSortBy("NameAsc");
    setPage(1);
  };

  const currency     = user?.currency || "THB";
  const accounts     = data?.items ?? [];
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Wallets & Accounts</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage your financial wallets, bank accounts, and cards.
          </p>
        </div>
        <button
          id="add-account-btn"
          onClick={() => setShowCreateModal(true)}
          className="ds-btn-primary px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Total Balance Hero */}
      <div
        className="ds-card p-6"
        style={{
          background:  "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)",
          borderColor: "hsl(var(--primary) / 0.25)",
        }}
      >
        <p className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2">
          Total Net Balance — All Accounts
        </p>
        <CurrencyDisplay amount={totalBalance} currency={currency} size="lg" />
        <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            {data?.totalCount ?? 0} total account{(data?.totalCount ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="ds-card p-3.5 flex flex-col gap-3 w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              id="accounts-search"
              type="text"
              placeholder="Search account name..."
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              className="ds-input w-full pl-9 pr-3 py-2.5 text-xs font-medium font-sans"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Account Type Filter */}
            <select
              id="accounts-type-filter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="ds-input px-3 py-2.5 text-xs font-semibold font-sans min-w-[140px]"
            >
              <option value="">All Account Types</option>
              <option value="1">Bank Accounts</option>
              <option value="2">E-Wallets</option>
              <option value="3">Transit Cards</option>
              <option value="4">Physical Cash</option>
              <option value="5">Savings Goals</option>
              <option value="6">Credit Lines</option>
            </select>

            {/* Sort Criteria */}
            <select
              id="accounts-sort"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="ds-input px-3 py-2.5 text-xs font-semibold font-sans min-w-[140px]"
            >
              <option value="NameAsc">Name (A-Z)</option>
              <option value="NameDesc">Name (Z-A)</option>
              <option value="BalanceHigh">Balance (Highest First)</option>
              <option value="BalanceLow">Balance (Lowest First)</option>
              <option value="DateDesc">Date Created (Newest)</option>
              <option value="DateAsc">Date Created (Oldest)</option>
            </select>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-initial ds-btn-primary px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider h-[38px] font-sans min-w-[80px]"
              >
                <Search className="h-3.5 w-3.5" />
                Find
              </button>
              {(search || typeFilter || sortBy !== "NameAsc") && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ds-btn-destructive px-3.5 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider h-[38px] font-sans"
                  title="Reset Filters"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-[hsl(var(--border))] hidden lg:block" />

            {/* Grid vs Table View Switcher */}
            <div className="flex items-center gap-1.5 bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] rounded-lg p-1 w-fit ml-auto sm:ml-0">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "card"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
                title="Grid Card Layout"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md"
                    : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                }`}
                title="List Table Layout"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[hsl(var(--primary))]" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="ds-alert-error flex items-center gap-2.5 p-4 text-sm font-mono">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{(error as Error).message}</p>
        </div>
      )}

      {/* Accounts Grid / Table */}
      {accounts.length > 0 && (
        <>
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account, idx) => {
                const typeStr = String(account.accountType);
                const colorClass = ACCOUNT_COLORS[typeStr] ?? ACCOUNT_COLORS.default;
                const icon       = ACCOUNT_ICONS[typeStr] ?? ACCOUNT_ICONS.default;
                const typeLabel  = getAccountTypeLabel(account.accountType);
                return (
                  <div
                    key={account.id ?? `account-${idx}`}
                    className="ds-card ds-card-interactive p-5 flex flex-col gap-4 cursor-pointer"
                    onClick={() => setSelectedAccount(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${colorClass}`}>
                        {icon}
                      </div>
                      <span className={`ds-badge ${colorClass}`}>{typeLabel}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{account.name}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5 uppercase">
                        {typeLabel} Account
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[hsl(var(--border))]">
                      <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">
                        Balance
                      </p>
                      <CurrencyDisplay
                        amount={account.balance}
                        currency={account.currency || currency}
                        size="md"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sm:border sm:border-[hsl(var(--border))] sm:bg-[hsl(var(--card))] sm:rounded-xl bg-transparent border-0 rounded-none overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_110px_130px] sm:grid-cols-[50px_1fr_120px_150px_130px] px-5 py-2.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.4)]">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  No.
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  Account Name
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-center">
                  Account Type
                </span>
                <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-center">
                  Created Date
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] text-right">
                  Balance
                </span>
              </div>

              {/* Table Rows */}
              {accounts.map((account, idx) => {
                const typeStr = String(account.accountType);
                const colorClass = ACCOUNT_COLORS[typeStr] ?? ACCOUNT_COLORS.default;
                const typeLabel  = getAccountTypeLabel(account.accountType);
                return (
                  <div
                    key={account.id ?? `account-${idx}`}
                    className={`ds-table-row grid grid-cols-[40px_1fr_110px_130px] sm:grid-cols-[50px_1fr_120px_150px_130px] px-5 py-3.5 items-center cursor-pointer ${
                      idx !== 0 ? "border-t border-[hsl(var(--border))]" : ""
                    }`}
                    onClick={() => setSelectedAccount(account)}
                  >
                    {/* Number index */}
                    <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </span>

                    {/* Name */}
                    <p className="text-sm font-medium truncate">
                      {account.name}
                    </p>

                    {/* Account Type badge */}
                    <div className="flex justify-center">
                      <span className={`ds-badge ${colorClass}`}>{typeLabel}</span>
                    </div>

                    {/* Created Date (desktop) */}
                    <div className="hidden sm:flex justify-center">
                      <span className="text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                        {new Date(account.createdAt).toLocaleDateString(undefined, {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </span>
                    </div>

                    {/* Balance */}
                    <div className="text-right">
                      <CurrencyDisplay
                        amount={account.balance}
                        currency={account.currency || currency}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="ds-card p-4">
              <Pagination meta={meta} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {accounts.length === 0 && !isLoading && (
        <div className="ds-card p-12 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--secondary))] flex items-center justify-center mb-4">
            <Wallet className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          {search || typeFilter ? (
            <>
              <h3 className="text-sm font-bold mb-1">No Accounts Found</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mb-5">
                No wallets or cards match your search criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="ds-btn-secondary px-5 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <X className="h-4 w-4" />
                Reset Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold mb-1">No Accounts Yet</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mb-5">
                Add your first wallet or bank account to get started.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="ds-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                Add First Account
              </button>
            </>
          )}
        </div>
      )}

      {showCreateModal && <CreateAccountModal onClose={() => setShowCreateModal(false)} />}
      {selectedAccount && (
        <AccountDetailsModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}

/** Account Details Modal */
function AccountDetailsModal({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const router = useRouter();
  const typeLabel = getAccountTypeLabel(account.accountType);
  const typeStr = String(account.accountType);
  const colorClass = ACCOUNT_COLORS[typeStr] ?? ACCOUNT_COLORS.default;
  const icon = ACCOUNT_ICONS[typeStr] ?? ACCOUNT_ICONS.default;

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
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${colorClass} mb-2`}>
            {icon}
            {typeLabel}
          </div>
          <h2 className="text-xl font-bold tracking-tight">{account.name}</h2>
        </div>

        <div className="space-y-4 font-sans">
          {/* Balance Block */}
          <div className="bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))] rounded-xl p-4 flex justify-between items-center">
            <div>
              <span className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1 font-mono">
                Current Balance
              </span>
              <CurrencyDisplay amount={account.balance} currency={account.currency || "THB"} size="md" />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="border border-[hsl(var(--border))] rounded-xl p-4 space-y-3 text-xs font-mono text-[hsl(var(--muted-foreground))]">
            <div className="flex justify-between items-center">
              <span>Account Type:</span>
              <span className="text-[hsl(var(--foreground))] font-semibold">{typeLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Date Created:
              </span>
              <span className="text-[hsl(var(--foreground))] font-semibold">
                {new Date(account.createdAt).toLocaleDateString(undefined, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Shortcut CTA Button */}
          <button
            onClick={() => {
              onClose();
              router.push(`/transactions?accountId=${account.id}`);
            }}
            className="w-full ds-btn-primary py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Clock className="h-4 w-4" />
            View Transaction History
          </button>
        </div>
      </div>
    </div>
  );
}
