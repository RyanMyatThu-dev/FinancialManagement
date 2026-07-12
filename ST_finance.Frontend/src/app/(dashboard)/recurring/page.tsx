"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { CurrencyDisplay } from "@/components/ui/CurrencyDisplay";
import { Pagination, type PaginationMeta } from "@/components/ui/Pagination";
import { Clock, Repeat, AlertTriangle, Loader2, Calendar, ArrowUpRight, ArrowDownLeft, Plus, X } from "lucide-react";
import { CreateRecurringModal } from "@/components/ui/CreateRecurringModal";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";

interface RecurringSchedule {
  id:               string;
  name:             string;
  amount:           number;
  transactionType:  string;
  frequency:        string;
  nextOccurrenceDate: string;
  category?:        string;
}

interface PagedRecurringResponse {
  items:           RecurringSchedule[];
  pageNumber:      number;
  pageSize:        number;
  totalCount:      number;
  totalPages:      number;
  hasPreviousPage: boolean;
  hasNextPage:     boolean;
}

const PAGE_SIZE = 12;

const FREQUENCY_COLORS: Record<string, string> = {
  Daily:   "ds-badge-success",
  Weekly:  "ds-badge-warning",
  Monthly: "ds-badge-pink",
  Yearly:  "ds-badge border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
};

export default function RecurringPage() {
  const { user }  = useAuth();
  const currency  = user?.currency || "THB";
  const [page,            setPage]            = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId,   setDeleteConfirmId]   = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<PagedRecurringResponse>({
    queryKey: ["recurring", page],
    queryFn: async () => {
      const res = await apiClient.get(`/api/recurring?pageNumber=${page}&pageSize=${PAGE_SIZE}`);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to fetch schedules");
    },
    placeholderData: (prev) => prev,
  });

  const schedules = data?.items ?? [];
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/recurring/${id}`);
      if (!res.data.isSuccess) throw new Error(res.data.error?.message || "Failed to delete schedule.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
    },
  });

  // Summary totals (page-level; full totals would need a separate aggregation endpoint)
  const totalIncome  = schedules.filter((s) => s.transactionType === "Income" ).reduce((sum, s) => sum + s.amount, 0);
  const totalExpense = schedules.filter((s) => s.transactionType === "Expense").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Recurring Schedules</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Configure stipend resets, billing schedules, and subscriptions.
          </p>
        </div>
        <button
          id="open-create-recurring-modal"
          onClick={() => setShowCreateModal(true)}
          className="ds-btn-primary px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          New Schedule
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-4">
        <div className="ds-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Recurring Income
            </span>
          </div>
          <CurrencyDisplay amount={totalIncome} currency={currency} size="sm" positiveColor />
        </div>
        <div className="ds-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-[hsl(var(--destructive))]" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
              Recurring Expenses
            </span>
          </div>
          <CurrencyDisplay amount={totalExpense} currency={currency} size="sm" negativeColor />
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

      {/* Schedule Cards */}
      {schedules.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((schedule, idx) => (
              <div key={schedule.id ?? `sched-${idx}`} className="ds-card ds-card-interactive p-5 flex flex-col gap-4">
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div
                    className={`h-10 w-10 rounded-xl border flex items-center justify-center ${
                      schedule.transactionType === "Income"
                        ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary)/0.25)]"
                        : "text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.1)] border-[hsl(var(--destructive)/0.25)]"
                    }`}
                  >
                    {schedule.transactionType === "Income" ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`ds-badge ${FREQUENCY_COLORS[schedule.frequency] || ""}`}>
                    {schedule.frequency}
                  </span>
                </div>

                {/* Name */}
                <div>
                  <p className="font-bold text-sm">{schedule.name}</p>
                  {schedule.category && (
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                      {schedule.category}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="pt-3 border-t border-[hsl(var(--border))]">
                  <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">
                    Amount per Cycle
                  </p>
                  <CurrencyDisplay
                    amount={schedule.amount}
                    currency={currency}
                    size="sm"
                    positiveColor={schedule.transactionType === "Income"}
                    negativeColor={schedule.transactionType === "Expense"}
                  />
                </div>

                {/* Next occurrence & Delete button */}
                <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                    <Calendar className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    <span>
                      Next:{" "}
                      {new Date(schedule.nextOccurrenceDate).toLocaleDateString(undefined, {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <button
                    id={`delete-recurring-btn-${schedule.id}`}
                    onClick={() => {
                      setDeleteConfirmId(schedule.id);
                      setDeleteConfirmName(schedule.name);
                    }}
                    className="ds-btn-icon h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)] transition-all"
                    title="Delete schedule"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
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
      {schedules.length === 0 && !isLoading && (
        <div className="ds-card p-12 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--secondary))] flex items-center justify-center mb-4">
            <Repeat className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="text-sm font-bold mb-1">No Recurring Schedules</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mb-5">
            Recurring billing and income schedules will appear here.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="ds-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            Add First Schedule
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRecurringModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Delete Confirmation Modal */}
      <CustomConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Recurring Schedule"
        message={`Are you sure you want to delete "${deleteConfirmName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep It"
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
          }
          setDeleteConfirmId(null);
        }}
        onCancel={() => setDeleteConfirmId(null)}
        isDestructive
      />
    </div>
  );
}
