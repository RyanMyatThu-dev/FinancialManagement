"use client";

import React from "react";
import { TransactionWizardModal } from "./TransactionWizardModal";

interface CreateTransactionModalProps {
  onClose: () => void;
  initialData?: {
    amount?: string;
    description?: string;
    categoryId?: string;
    accountId?: string;
    type?: string;
  };
}

export function CreateTransactionModal({ onClose, initialData }: CreateTransactionModalProps) {
  return <TransactionWizardModal onClose={onClose} initialData={initialData} />;
}
