"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobilePopup, setActiveMobilePopup] = useState<Toast | null>(null);

  // Check screen size for responsiveness
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type };

    if (isMobile) {
      // For mobile: show popup modal
      setActiveMobilePopup(newToast);
    } else {
      // For desktop: add to toast stack
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-[hsl(var(--primary))]" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-[hsl(var(--destructive))]" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-[hsl(var(--primary)/0.3)]";
      case "error":
        return "border-[hsl(var(--destructive)/0.3)]";
      case "warning":
        return "border-amber-500/30";
      case "info":
      default:
        return "border-blue-500/30";
    }
  };

  const getMobileTitle = (type: ToastType) => {
    switch (type) {
      case "success":
        return "Success";
      case "error":
        return "Error Occurred";
      case "warning":
        return "Warning";
      case "info":
      default:
        return "Information";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Desktop Toasts Rendering (Top Right Stack) */}
      {!isMobile && toasts.length > 0 && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md bg-zinc-900/85 shadow-2xl transition-all duration-300 animate-[slideInRight_0.25s_ease-out] ${getBorderColor(
                toast.type
              )}`}
            >
              <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
              <div className="flex-1 text-xs font-mono font-medium text-zinc-100 leading-normal">
                {toast.message}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Pop-up Modal Rendering */}
      {isMobile && activeMobilePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div 
            className={`ds-card w-full max-w-xs p-6 text-center flex flex-col items-center gap-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl animate-[scaleUp_0.25s_ease-out]`}
          >
            <div className="h-14 w-14 rounded-full bg-zinc-800/50 flex items-center justify-center text-center">
              {getIcon(activeMobilePopup.type)}
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-200">
                {getMobileTitle(activeMobilePopup.type)}
              </h3>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed px-1">
                {activeMobilePopup.message}
              </p>
            </div>

            <button
              onClick={() => setActiveMobilePopup(null)}
              className="ds-btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg mt-1"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
