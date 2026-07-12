"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Pagination, type PaginationMeta } from "@/components/ui/Pagination";
import { Wallet, CreditCard, PiggyBank, TrendingUp, Loader2, AlertTriangle, Plus } from "lucide-react";
import { CreateAccountModal } from "@/components/ui/CreateAccountModal";

interface Account {
  id: string;
  name: string;
  accountType: string;
  balance: number;
  currency?: string;
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
  Bank:        <Wallet      className="h-5 w-5" />,
  EWallet:     <CreditCard  className="h-5 w-5" />,
  TransitCard: <CreditCard  className="h-5 w-5" />,
  Cash:        <PiggyBank   className="h-5 w-5" />,
  Savings:     <PiggyBank   className="h-5 w-5" />,
  Credit:      <CreditCard  className="h-5 w-5" />,
  default:     <TrendingUp  className="h-5 w-5" />,
};

const ACCOUNT_COLORS: Record<string, string> = {
  Bank:        "text-[hsl(var(--primary))]         bg-[hsl(var(--primary)/0.1)]         border-[hsl(var(--primary)/0.25)]",
  EWallet:     "text-[hsl(var(--safe-to-spend))]   bg-[hsl(var(--safe-to-spend)/0.1)]   border-[hsl(var(--safe-to-spend)/0.25)]",
  TransitCard: "text-[hsl(var(--chula-pink))]      bg-[hsl(var(--chula-pink)/0.1)]      border-[hsl(var(--chula-pink)/0.25)]",
  Cash:        "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]           border-[hsl(var(--border))]",
  default:     "text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))]           border-[hsl(var(--border))]",
};

export default function AccountsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading, error } = useQuery<PagedAccountResponse>({
    queryKey: ["accounts", page],
    queryFn: async () => {
      const res = await apiClient.get(`/api/accounts?pageNumber=${page}&pageSize=${PAGE_SIZE}`);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch accounts");
    },
    placeholderData: (prev) => prev,
  });

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

      {/* Accounts Grid */}
      {accounts.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account, idx) => {
              const colorClass = ACCOUNT_COLORS[account.accountType] ?? ACCOUNT_COLORS.default;
              const icon       = ACCOUNT_ICONS[account.accountType] ?? ACCOUNT_ICONS.default;
              return (
                <div
                  key={account.id ?? `account-${idx}`}
                  className="ds-card ds-card-interactive p-5 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${colorClass}`}>
                      {icon}
                    </div>
                    <span className={`ds-badge ${colorClass}`}>{account.accountType}</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{account.name}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5 uppercase">
                      {account.accountType} Account
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

          {/* Pagination */}
          {meta && (
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
        </div>
      )}

      {showCreateModal && <CreateAccountModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
