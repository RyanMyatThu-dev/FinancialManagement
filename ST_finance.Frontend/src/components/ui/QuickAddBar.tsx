"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { Plus, Zap, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CreateAccountModal } from "@/components/ui/CreateAccountModal";
import { QuickPickModal } from "@/components/ui/QuickPickModal";

interface Account {
  id: string;
  name: string;
  accountType: string;
  balance: number;
}

interface QuickAddBarProps {
  onOpenWizard: (initialData?: { amount?: string; description?: string; categoryId?: string; accountId?: string; type?: string }) => void;
}

export function QuickAddBar({ onOpenWizard }: QuickAddBarProps) {
  const { user } = useAuth();
  const currency = user?.currency || "THB";

  const [showQuickPick, setShowQuickPick] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);

  // Fetch accounts to determine zero-account state
  const { data: accounts = [], isFetched: isAccountsFetched } = useQuery<Account[]>({
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

  // ── ZERO-ACCOUNT GUARDRAIL ──────────────────────────────────────────────────
  if (isAccountsFetched && accounts.length === 0) {
    return (
      <section aria-label="Quick Add Transaction" className="mb-6">
        <div className="ds-card p-4 sm:p-5 border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)] shadow-md animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--warning)/0.2)] text-[hsl(var(--warning))] shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">
                  No accounts created yet
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono leading-relaxed">
                  You need at least one wallet account before logging transactions.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(true)}
                className="ds-btn-primary px-4 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[44px] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <Plus className="h-4 w-4" /> Create Account
              </button>
            </div>
          </div>
        </div>
        {showCreateAccountModal && (
          <CreateAccountModal onClose={() => setShowCreateAccountModal(false)} />
        )}
      </section>
    );
  }

  return (
    <>
      <section aria-label="Quick Add Transaction" className="mb-6">
        <div className="ds-card p-4 sm:p-5 border-[hsl(var(--primary)/0.25)] bg-[hsl(var(--card))] shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] shrink-0">
              <Zap className="h-5 w-5 fill-[hsl(var(--primary))]" />
            </span>
            <div>
              <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
                Quick Add
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                Log a frequent expense instantly · tap Add for shortcuts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickPick(true)}
            className="ds-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 min-h-[40px] shrink-0 focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            aria-label="Open Quick Add shortcuts modal"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </section>

      {showQuickPick && (
        <QuickPickModal
          onClose={() => setShowQuickPick(false)}
          onOpenWizard={(data) => {
            setShowQuickPick(false);
            onOpenWizard(data);
          }}
        />
      )}
    </>
  );
}
