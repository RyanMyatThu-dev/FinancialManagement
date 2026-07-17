"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { X, Loader2, AlertTriangle, Wallet, CreditCard, PiggyBank, Plus } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface CreateAccountModalProps {
  onClose: () => void;
}

export function CreateAccountModal({ onClose }: CreateAccountModalProps) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [name,        setName]        = useState("");
  const [accountType, setAccountType] = useState<number>(1); // Bank = 1
  const [balance,     setBalance]     = useState("");
  const [color,       setColor]       = useState("#10B981");
  const [icon,        setIcon]        = useState("Wallet");
  const [error,       setError]       = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (body: {
      name: string;
      accountType: number;
      balance: number;
      color: string;
      icon: string;
    }) => {
      const res = await apiClient.post("/api/accounts", body);
      if (res.data.isSuccess && res.data.value) return res.data.value;
      throw new Error(res.data.error?.message || "Failed to create account.");
    },
    onSuccess: () => {
      showToast("Account created successfully", "success");
      qc.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Account name cannot be empty.");
      return;
    }

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setError("Initial balance cannot be negative.");
      return;
    }

    mutation.mutate({
      name: name.trim(),
      accountType,
      balance: parsedBalance,
      color,
      icon,
    });
  };

  const accountTypes = [
    { value: 1, label: "Bank Account (SCB/KBank)", icon: <Wallet className="h-4 w-4" /> },
    { value: 2, label: "E-Wallet (TrueMoney)", icon: <CreditCard className="h-4 w-4" /> },
    { value: 3, label: "Transit Card (Rabbit)", icon: <CreditCard className="h-4 w-4" /> },
    { value: 4, label: "Physical Cash Pocket", icon: <PiggyBank className="h-4 w-4" /> },
  ];

  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#06B6D4"];

  const icons = [
    { name: "Wallet", label: "Wallet" },
    { name: "CreditCard", label: "Card" },
    { name: "PiggyBank", label: "Savings" },
    { name: "Coins", label: "Cash" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-md p-6 relative">
        <button
          id="close-create-account-modal"
          onClick={onClose}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
            New Account
          </div>
          <h2 className="text-lg font-bold tracking-tight">Add Account</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Register a new wallet, transit card, or banking account.
          </p>
        </div>

        {error && (
          <div className="ds-alert-error flex items-start gap-2 p-3 mb-4 text-xs font-mono">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form id="create-account-form" onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* Account Name */}
          <div>
            <label htmlFor="account-name" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Account Name
            </label>
            <input
              id="account-name"
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SCB Savings, Cash Pocket"
              className="ds-input w-full px-3 py-2.5 text-sm"
              autoComplete="off"
            />
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="account-type" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Account Type
            </label>
            <select
              id="account-type"
              value={accountType}
              onChange={(e) => setAccountType(parseInt(e.target.value))}
              className="ds-input w-full px-3 py-2.5 text-sm"
            >
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Balance */}
          <div>
            <label htmlFor="account-balance" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Initial Balance
            </label>
            <input
              id="account-balance"
              type="number"
              required
              min="0"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="ds-input w-full px-3 py-2.5 text-sm font-mono"
              autoComplete="off"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2 font-mono">
              Theme Color
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-all ${
                    color === c ? "border-[hsl(var(--foreground))]" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label htmlFor="account-icon" className="block text-[10px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-1.5 font-mono">
              Display Icon
            </label>
            <select
              id="account-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="ds-input w-full px-3 py-2.5 text-sm"
            >
              {icons.map((i) => (
                <option key={i.name} value={i.name}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          <button
            id="create-account-submit"
            type="submit"
            disabled={mutation.isPending}
            className="ds-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Registering...</>
            ) : (
              <><Plus className="h-3.5 w-3.5" /> Register Account</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
