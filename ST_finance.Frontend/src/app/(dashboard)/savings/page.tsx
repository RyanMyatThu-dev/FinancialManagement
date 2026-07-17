"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { CurrencyDisplay, formatCurrency } from "@/components/ui/CurrencyDisplay";
import { TechProgress } from "@/components/ui/TechProgress";
import { Pagination, type PaginationMeta } from "@/components/ui/Pagination";
import {
  Target,
  PiggyBank,
  Loader2,
  AlertTriangle,
  Plus,
  CheckCircle,
  X,
  ArrowDownLeft,
  ArrowUpLeft,
  Calendar,
  ChevronRight,
  Clock,
  Info,
} from "lucide-react";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";

/* ── API Types (aligned to SavingsGoalModels.cs) ─────────────────── */
interface SavingsGoalResponse {
  id: string;
  userId: string;
  goalName: string;
  targetAmount: number;
  targetDate: string | null;
  isCompleted: boolean;
  currentAmount: number;
  createdAt: string;
  completedAt: string | null;
}

interface SavingsContributionResponse {
  id: string;
  savingsGoalId: string;
  transactionId: string | null;
  amount: number;
  date: string;
  note: string | null;
}

/* POST /api/savings-goals */
interface CreateSavingsGoalRequest {
  goalName: string;
  targetAmount: number;
  targetDate: string | null;
}

/* POST /api/savings-goals/{id}/contribute */
interface ContributeRequest {
  amount: number;
  note: string | null;
}

const PAGE_SIZE = 12;

interface PagedSavingsGoalResponse {
  items:           SavingsGoalResponse[];
  pageNumber:      number;
  pageSize:        number;
  totalCount:      number;
  totalPages:      number;
  hasPreviousPage: boolean;
  hasNextPage:     boolean;
}

/* ── API helpers ─────────────────────────────────────────────────── */
const fetchGoals = async (page: number): Promise<PagedSavingsGoalResponse> => {
  const res = await apiClient.get(`/api/savings-goals?pageNumber=${page}&pageSize=${PAGE_SIZE}`);
  if (res.data.isSuccess && res.data.value) return res.data.value;
  throw new Error(res.data.error?.message || "Failed to fetch savings goals");
};

const fetchCompletedGoals = async (page: number, sortBy: string): Promise<PagedSavingsGoalResponse> => {
  const res = await apiClient.get(`/api/savings-goals/completed?pageNumber=${page}&pageSize=${PAGE_SIZE}&sortBy=${sortBy}`);
  if (res.data.isSuccess && res.data.value) return res.data.value;
  throw new Error(res.data.error?.message || "Failed to fetch completed savings goals");
};

const fetchContributions = async (goalId: string): Promise<SavingsContributionResponse[]> => {
  const res = await apiClient.get(`/api/savings-goals/${goalId}/contributions`);
  if (res.data.isSuccess && res.data.value) return res.data.value;
  throw new Error(res.data.error?.message || "Failed to fetch contributions");
};

const createGoal = async (body: CreateSavingsGoalRequest): Promise<SavingsGoalResponse> => {
  const res = await apiClient.post("/api/savings-goals", body);
  if (res.data.isSuccess && res.data.value) return res.data.value;
  throw new Error(res.data.error?.message || "Failed to create goal");
};

const contributeToGoal = async (goalId: string, body: ContributeRequest): Promise<SavingsGoalResponse> => {
  const res = await apiClient.post(`/api/savings-goals/${goalId}/contribute`, body);
  if (res.data.isSuccess && res.data.value) return res.data.value;
  throw new Error(res.data.error?.message || "Failed to contribute");
};

const completeGoal = async (goalId: string): Promise<SavingsGoalResponse> => {
  const res = await apiClient.post(`/api/savings-goals/${goalId}/complete`);
  if (res.data.isSuccess && res.data.value) return res.data.value;
  throw new Error(res.data.error?.message || "Failed to complete goal");
};

const deleteGoal = async (goalId: string): Promise<void> => {
  const res = await apiClient.delete(`/api/savings-goals/${goalId}`);
  if (!res.data.isSuccess) throw new Error(res.data.error?.message || "Failed to delete goal");
};

/* ── Sub-Components ───────────────────────────────────────────────── */

/** Create Goal Modal */
function CreateGoalModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [goalName,    setGoalName]    = useState("");
  const [targetAmount,setTargetAmount]= useState("");
  const [targetDate,  setTargetDate]  = useState("");
  const [error,       setError]       = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (body: CreateSavingsGoalRequest) => createGoal(body),
    onSuccess: () => {
      showToast("Goal created successfully", "success");
      qc.invalidateQueries({ queryKey: ["savings-goals"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!goalName.trim()) {
      setError("Goal name cannot be empty.");
      return;
    }

    const parsedAmount = parseFloat(targetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Target amount must be greater than zero.");
      return;
    }

    if (targetDate) {
      const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local format
      if (targetDate <= todayStr) {
        setError("Target date must be in the future.");
        return;
      }
    }

    mutation.mutate({
      goalName: goalName.trim(),
      targetAmount: parsedAmount,
      targetDate:   targetDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-md p-6 relative">
        <button
          id="close-create-goal-modal"
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
            New Goal
          </div>
          <h2 className="text-lg font-bold tracking-tight">Create Savings Goal</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Earmark funds and lock them from daily spending.
          </p>
        </div>

        {error && (
          <div className="ds-alert-error flex items-start gap-2 p-3 mb-4 text-xs font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form id="create-goal-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Goal Name */}
          <div>
            <label htmlFor="goal-name" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Goal Name
            </label>
            <input
              id="goal-name"
              type="text"
              required
              maxLength={150}
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="e.g. Emergency Fund, New Laptop"
              className="ds-input w-full px-3 py-2.5 text-sm"
              autoComplete="off"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label htmlFor="goal-target" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Target Amount
            </label>
            <input
              id="goal-target"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="10000.00"
              className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              autoComplete="off"
            />
          </div>

          {/* Target Date (optional) */}
          <div>
            <label htmlFor="goal-date" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Target Date <span className="normal-case font-normal opacity-60">(optional)</span>
            </label>
            <input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              autoComplete="off"
            />
          </div>

          <button
            id="create-goal-submit"
            type="submit"
            disabled={mutation.isPending}
            className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</>
            ) : (
              <><Plus className="h-3.5 w-3.5" /> Create Goal</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Contribute Modal */
function ContributeModal({
  goal,
  onClose,
}: {
  goal: SavingsGoalResponse;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [note,   setNote]   = useState("");
  const { user } = useAuth();
  const { showToast } = useToast();
  const currency = user?.currency || "THB";
  const [error,  setError]  = useState<string | null>(null);

  const { data: summaryData } = useQuery({
    queryKey: ["dashboardSummary", "Month"],
    queryFn: async () => {
      const res = await apiClient.get("/api/dashboard/summary?timeframe=Month");
      return res.data.value;
    },
  });
  const disposableBalance = summaryData?.disposableBalance ?? 0;

  const mutation = useMutation({
    mutationFn: (body: ContributeRequest) => contributeToGoal(goal.id, body),
    onSuccess: (data, variables) => {
      showToast(variables.amount > 0 ? "Goal contribution saved successfully" : "Goal withdrawal saved successfully", "success");
      qc.invalidateQueries({ queryKey: ["savings-goals"] });
      qc.invalidateQueries({ queryKey: ["savings-contributions", goal.id] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      setError("Amount cannot be zero.");
      return;
    }

    if (parsedAmount > 0) {
      if (parsedAmount > disposableBalance) {
        setError(`Insufficient disposable balance (${disposableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}) to contribute.`);
        return;
      }
      
      const remaining = goal.targetAmount - goal.currentAmount;
      if (parsedAmount > remaining) {
        setError(`Contribution exceeds the remaining goal amount of ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}.`);
        return;
      }
    } else {
      if (goal.currentAmount + parsedAmount < 0) {
        setError(`Cannot withdraw more than currently saved (${goal.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}).`);
        return;
      }
    }

    mutation.mutate({
      amount: parsedAmount,
      note: note.trim() || null,
    });
  };

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-md p-6 relative">
        <button
          id="close-contribute-modal"
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--safe-to-spend))]" />
            Contribute
          </div>
          <h2 className="text-lg font-bold tracking-tight">{goal.goalName}</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono">
            Remaining:{" "}
            <span className="text-[hsl(var(--foreground))] font-bold">
              {remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        {error && (
          <div className="ds-alert-error flex items-start gap-2 p-3 mb-4 text-xs font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form id="contribute-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Amount — positive to add, negative to withdraw */}
          <div>
            <label htmlFor="contribute-amount" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Amount{" "}
              <span className="normal-case font-normal opacity-60">(negative to withdraw)</span>
            </label>
            <input
              id="contribute-amount"
              type="number"
              required
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500.00"
              className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              autoComplete="off"
            />
          </div>

          {/* Note (optional) */}
          <div>
            <label htmlFor="contribute-note" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Note <span className="normal-case font-normal opacity-60">(optional)</span>
            </label>
            <input
              id="contribute-note"
              type="text"
              maxLength={250}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Monthly top-up, bonus, etc."
              className="ds-input w-full px-3 py-2.5 text-sm"
              autoComplete="off"
            />
          </div>

          <button
            id="contribute-submit"
            type="submit"
            disabled={mutation.isPending}
            className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Contributing...</>
            ) : (
              <><ArrowDownLeft className="h-3.5 w-3.5" /> Confirm Contribution</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Complete Goal (Congratulatory Confirmation) Modal */
function CompleteGoalModal({
  goal,
  onClose,
}: {
  goal: SavingsGoalResponse;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => completeGoal(goal.id),
    onSuccess: () => {
      showToast("Savings goal completed successfully", "success");
      qc.invalidateQueries({ queryKey: ["savings-goals"] });
      qc.invalidateQueries({ queryKey: ["completed-savings-goals"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleConfirm = () => {
    setError(null);
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-md p-6 relative overflow-hidden border-[hsl(var(--primary)/0.3)]">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[hsl(var(--primary)/0.15)] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[hsl(var(--safe-to-spend)/0.15)] blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7 z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-4 pt-4 relative z-10 font-mono">
          <div className="mx-auto h-16 w-16 rounded-full bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.25)] flex items-center justify-center text-[hsl(var(--primary))] animate-bounce">
            <Target className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--primary))]">
              Goal Target Achieved! 🎉
            </span>
            <h2 className="text-xl font-black tracking-tight font-sans">{goal.goalName}</h2>
          </div>

          <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto leading-relaxed font-sans">
            Amazing job! You have fully funded this goal. Confirming completion will archive this goal, locking it from modifications and making it appear in your completed achievements list.
          </p>

          <div className="bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-3.5 flex justify-between text-left text-xs">
            <div>
              <span className="block opacity-60 uppercase text-[9px] tracking-wider mb-0.5">Target</span>
              <span className="font-bold">{goal.targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="text-right">
              <span className="block opacity-60 uppercase text-[9px] tracking-wider mb-0.5">Saved</span>
              <span className="font-bold text-[hsl(var(--primary))]">{goal.currentAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {error && (
            <div className="ds-alert-error flex items-start gap-2 p-3 text-xs text-left">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2 font-sans">
            <button
              onClick={onClose}
              className="flex-1 ds-btn-outline py-2.5 text-xs font-bold uppercase tracking-wider"
            >
              Keep Active
            </button>
            <button
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className="flex-1 ds-btn-primary py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            >
              {mutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Archiving...</>
              ) : (
                <><CheckCircle className="h-3.5 w-3.5" /> Confirm Complete</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Contributions History Panel */
function ContributionsPanel({ goal, onClose }: { goal: SavingsGoalResponse; onClose: () => void }) {
  const { data, isLoading } = useQuery<SavingsContributionResponse[]>({
    queryKey: ["savings-contributions", goal.id],
    queryFn:  () => fetchContributions(goal.id),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-lg p-6 relative max-h-[80vh] flex flex-col">
        <button
          id="close-contributions-panel"
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-tight">{goal.goalName}</h2>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono uppercase tracking-widest mt-0.5">
            Contribution History
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
            </div>
          )}
          {data && data.length === 0 && (
            <p className="text-center text-xs font-mono text-[hsl(var(--muted-foreground))] py-8">
              No contributions yet.
            </p>
          )}
          {data?.map((c, idx) => (
            <div
              key={c.id ?? idx}
              className="ds-card p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                    c.amount >= 0
                      ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary)/0.25)]"
                      : "text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.1)] border-[hsl(var(--destructive)/0.25)]"
                  }`}
                >
                  {c.amount >= 0 ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpLeft className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium">{c.note || "Contribution"}</p>
                  <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                    {new Date(c.date).toLocaleDateString(undefined, {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <p
                className={`font-mono tabular-nums font-bold text-sm ${
                  c.amount >= 0
                    ? "text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--destructive))]"
                }`}
              >
                {c.amount >= 0 ? "+" : ""}
                {c.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Completed Goals Section Component */
function CompletedGoalsSection({ currency }: { currency: string }) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("CompletedAt");
  const [contributionsGoal, setContributionsGoal] = useState<SavingsGoalResponse | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>("");

  const { data, isLoading } = useQuery<PagedSavingsGoalResponse>({
    queryKey: ["completed-savings-goals", page, sortBy],
    queryFn:  () => fetchCompletedGoals(page, sortBy),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess:  () => {
      showToast("Archived savings goal deleted successfully", "success");
      qc.invalidateQueries({ queryKey: ["completed-savings-goals"] });
      setPage(1);
    },
  });

  const goals = data?.items ?? [];
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

  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  if (goals.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-[hsl(var(--border))] pt-8 mt-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[hsl(var(--primary))]" />
            Completed Archive
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-sans">
            Goals you have successfully fully funded and archived.
          </p>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-completed" className="text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-mono">
            Sort By
          </label>
          <select
            id="sort-completed"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="ds-input py-1 px-2.5 text-xs font-mono"
          >
            <option value="CompletedAt">Completion Date</option>
            <option value="CreatedAt">Start Date</option>
            <option value="TargetDate">Target Date</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal, idx) => {
          const startDate = new Date(goal.createdAt).toLocaleDateString(undefined, {
            day: "2-digit", month: "short", year: "numeric",
          });
          const targetDate = goal.targetDate
            ? new Date(goal.targetDate).toLocaleDateString(undefined, {
                day: "2-digit", month: "short", year: "numeric",
              })
            : "No target date";
          const compDate = goal.completedAt
            ? new Date(goal.completedAt).toLocaleDateString(undefined, {
                day: "2-digit", month: "short", year: "numeric",
              })
            : "Unknown";

          // Calculate "how early we completed that"
          let completionBadge = null;
          if (goal.targetDate && goal.completedAt) {
            const tDate = new Date(goal.targetDate);
            const cDate = new Date(goal.completedAt);
            const tDateOnly = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
            const cDateOnly = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate());
            const diffTime = tDateOnly.getTime() - cDateOnly.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
              completionBadge = (
                <span className="ds-badge ds-badge-success text-[9px] uppercase tracking-wider font-bold">
                  {diffDays} days early!
                </span>
              );
            } else if (diffDays === 0) {
              completionBadge = (
                <span className="ds-badge ds-badge-success text-[9px] uppercase tracking-wider font-bold">
                  On time
                </span>
              );
            } else {
              completionBadge = (
                <span className="ds-badge ds-badge-warning text-[9px] uppercase tracking-wider font-bold">
                  {Math.abs(diffDays)} days late
                </span>
              );
            }
          }

          return (
            <div
              key={goal.id ?? `completed-${idx}`}
              className="ds-card p-5 border-[hsl(var(--primary)/0.15)] bg-[hsl(var(--secondary)/0.3)] flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Completed background stamp */}
              <div className="absolute -bottom-8 -right-8 opacity-[0.03] text-[hsl(var(--primary))] pointer-events-none">
                <CheckCircle className="h-32 w-32" />
              </div>

              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm text-[hsl(var(--foreground))] line-clamp-1">{goal.goalName}</h3>
                {completionBadge}
              </div>

              <div className="space-y-2 text-[11px] font-mono text-[hsl(var(--muted-foreground))]">
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="text-[hsl(var(--foreground))] font-medium">{startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Date:</span>
                  <span className="text-[hsl(var(--foreground))] font-medium">{targetDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed At:</span>
                  <span className="text-[hsl(var(--primary))] font-bold">{compDate}</span>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-[hsl(var(--border)/0.5)] pt-3.5">
                <div>
                  <span className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest block mb-0.5">Funded</span>
                  <CurrencyDisplay amount={goal.currentAmount} currency={currency} size="sm" positiveColor />
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest block mb-0.5">Target</span>
                  <span className="text-xs font-semibold font-mono opacity-80">{goal.targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-[hsl(var(--border)/0.5)] pt-3.5 font-sans">
                <button
                  onClick={() => setContributionsGoal(goal)}
                  className="flex-1 ds-btn-outline py-1.5 text-[11px] font-bold flex items-center justify-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  History
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirmId(goal.id);
                    setDeleteConfirmName(goal.goalName);
                  }}
                  className="ds-btn-icon h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)] transition-all"
                  title="Delete archive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {meta && (
        <div className="ds-card p-4">
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}

      {/* Modals within CompletedGoalsSection */}
      {contributionsGoal && (
        <ContributionsPanel goal={contributionsGoal} onClose={() => setContributionsGoal(null)} />
      )}

      <CustomConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Savings Goal Archive"
        message={`Are you sure you want to delete the archived savings goal "${deleteConfirmName}"? This action is irreversible.`}
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

/* ── Main Page ─────────────────────────────────────────────────────── */
export default function SavingsPage() {
  const { user } = useAuth();
  const qc       = useQueryClient();
  const currency = user?.currency || "THB";

  const [showCreateModal,     setShowCreateModal]     = useState(false);
  const [contributeGoal,      setContributeGoal]      = useState<SavingsGoalResponse | null>(null);
  const [completeGoalItem,    setCompleteGoalItem]    = useState<SavingsGoalResponse | null>(null);
  const [contributionsGoal,   setContributionsGoal]   = useState<SavingsGoalResponse | null>(null);
  const [page,                setPage]                = useState(1);
  const { showToast } = useToast();
  const [deleteConfirmId,     setDeleteConfirmId]     = useState<string | null>(null);
  const [deleteConfirmName,   setDeleteConfirmName]   = useState<string>("");

  const { data, isLoading, error } = useQuery<PagedSavingsGoalResponse>({
    queryKey: ["savings-goals", page],
    queryFn:  () => fetchGoals(page),
    placeholderData: (prev) => prev,
  });

  const goals = data?.items ?? [];
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
    mutationFn: deleteGoal,
    onSuccess:  () => {
      showToast("Savings goal deleted successfully", "success");
      qc.invalidateQueries({ queryKey: ["savings-goals"] });
      setPage(1);
    },
  });

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount,  0);
  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct  = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Savings Goals</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Earmark funds virtually and lock them from daily safe-to-spend limits.
          </p>
        </div>
        <button
          id="open-create-goal-modal"
          onClick={() => setShowCreateModal(true)}
          className="ds-btn-primary px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </button>
      </div>

      {/* ── Explanation Info Card ────────────────────────────────────── */}
      <div className="bg-[hsl(var(--secondary)/0.3)] p-4 rounded-lg border border-[hsl(var(--border))] text-xs font-mono space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--primary))] flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
          💡 How Savings Pacing Works
        </span>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
          <strong>Earmarked Savings:</strong> Any contributions you make to a goal are instantly "locked" and subtracted from your <em>Disposable Pool</em>, ensuring you do not spend that cash.
        </p>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
          <strong>Goal Pacing:</strong> If a goal has a future target date, the pacing engine calculates the daily amount required to meet that goal. Your daily quota is reduced by this daily share to make sure you stay on track, even before making contributions!
        </p>
      </div>

      {/* ── Overall Progress Hero ─────────────────────────────────────── */}
      {goals && goals.length > 0 && (
        <div
          className="ds-card p-6"
          style={{
            background:  "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--secondary)) 100%)",
            borderColor: "hsl(var(--safe-to-spend) / 0.25)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">
                Total Earmarked
              </p>
              <CurrencyDisplay amount={totalSaved} currency={currency} size="lg" />
              <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-1">
                of{" "}
                <span className="text-[hsl(var(--foreground))] font-bold">
                  {totalTarget.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}
                </span>{" "}
                target
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold font-mono text-[hsl(var(--safe-to-spend))] tabular-nums">
                {overallPct.toFixed(1)}%
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">overall progress</p>
            </div>
          </div>
          <TechProgress
            value={overallPct}
            color="safe"
            minVal={formatCurrency(0, currency)}
            maxVal={formatCurrency(totalTarget, currency)}
          />
        </div>
      )}

      {/* ── Loading ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[hsl(var(--primary))]" />
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="ds-alert-error flex items-center gap-2.5 p-4 text-sm font-mono">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>{(error as Error).message}</p>
        </div>
      )}

      {/* ── Goal Cards Grid ──────────────────────────────────────────── */}
      {goals.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal, idx) => {
            const pct        = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining  = goal.targetAmount - goal.currentAmount;
            const isTargetMet = goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id ?? `goal-${idx}`}
                className="ds-card ds-card-interactive p-5 flex flex-col gap-4"
              >
                {/* Icon + status */}
                <div className="flex items-center justify-between">
                  <div
                    className="h-10 w-10 rounded-xl border flex items-center justify-center text-[hsl(var(--safe-to-spend))] bg-[hsl(var(--safe-to-spend)/0.1)] border-[hsl(var(--safe-to-spend)/0.25)]"
                  >
                    <Target className="h-5 w-5" />
                  </div>
                  {goal.targetDate ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
                      <Calendar className="h-3 w-3" />
                      {new Date(goal.targetDate).toLocaleDateString(undefined, {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  ) : null}
                </div>

                {/* Name */}
                <div>
                  <p className="font-bold text-sm">{goal.goalName}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                    {remaining > 0
                      ? `${remaining.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency} remaining`
                      : "Target reached!"}
                  </p>
                </div>

                {/* Amounts */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">
                      Saved
                    </p>
                    <CurrencyDisplay amount={goal.currentAmount} currency={currency} size="sm" />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1">
                      Target
                    </p>
                    <CurrencyDisplay amount={goal.targetAmount} currency={currency} size="sm" />
                  </div>
                </div>

                {/* Progress Widget */}
                <TechProgress
                  value={pct}
                  color="safe"
                  minVal="0%"
                  maxVal="100%"
                />

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[hsl(var(--border))] font-sans">
                  {isTargetMet ? (
                    <button
                      id={`complete-btn-${goal.id}`}
                      onClick={() => setCompleteGoalItem(goal)}
                      className="flex-1 ds-btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5 bg-[hsl(var(--primary))] border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.95)]"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Complete Goal
                    </button>
                  ) : (
                    <button
                      id={`contribute-btn-${goal.id}`}
                      onClick={() => setContributeGoal(goal)}
                      className="flex-1 ds-btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                      Contribute
                    </button>
                  )}
                  <button
                    id={`history-btn-${goal.id}`}
                    onClick={() => setContributionsGoal(goal)}
                    className="ds-btn-outline flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    History
                  </button>
                  <button
                    id={`delete-goal-btn-${goal.id}`}
                    onClick={() => {
                      setDeleteConfirmId(goal.id);
                      setDeleteConfirmName(goal.goalName);
                    }}
                    className="ds-btn-icon h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)] transition-all"
                    title="Delete goal"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
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

      {/* ── Empty State ───────────────────────────────────────────────── */}
      {goals && goals.length === 0 && !isLoading && (
        <div className="ds-card p-12 flex flex-col items-center justify-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--secondary))] flex items-center justify-center mb-4">
            <PiggyBank className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h3 className="text-sm font-bold mb-1">No Savings Goals Yet</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mb-5">
            Create your first goal and lock funds from daily spending limits.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="ds-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            Create First Goal
          </button>
        </div>
      )}

      {/* ── Completed Goals Section ──────────────────────────────────── */}
      <CompletedGoalsSection currency={currency} />

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {showCreateModal  && <CreateGoalModal     onClose={() => setShowCreateModal(false)} />}
      {contributeGoal   && <ContributeModal     goal={contributeGoal}    onClose={() => setContributeGoal(null)} />}
      {completeGoalItem && <CompleteGoalModal   goal={completeGoalItem}  onClose={() => setCompleteGoalItem(null)} />}
      {contributionsGoal && <ContributionsPanel goal={contributionsGoal} onClose={() => setContributionsGoal(null)} />}

      {/* Delete Confirmation Modal */}
      <CustomConfirmModal
        isOpen={!!deleteConfirmId}
        title="Delete Savings Goal"
        message={`Are you sure you want to delete the savings goal "${deleteConfirmName}"? This action is irreversible.`}
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
