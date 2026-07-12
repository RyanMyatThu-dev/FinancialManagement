"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function CustomConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}: CustomConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="ds-card w-full max-w-sm p-6 relative border border-[hsl(var(--border))] bg-[hsl(var(--card))] rounded-xl shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 ds-btn-icon h-7 w-7"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
            isDestructive 
              ? "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))]" 
              : "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
          }`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold tracking-tight text-[hsl(var(--foreground))]">
            {title}
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 font-mono leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] text-xs font-bold uppercase tracking-wider transition-all text-[hsl(var(--foreground))]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              isDestructive 
                ? "bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.8)] text-white" 
                : "ds-btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
