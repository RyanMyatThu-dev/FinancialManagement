"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallToast() {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Slide in after 2.5s delay, only if installable and not already installed
  useEffect(() => {
    if (!canInstall || isInstalled || dismissed) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    // Allow animation to finish before unmounting
    setTimeout(() => setDismissed(true), 400);
  };

  const handleInstall = async () => {
    await triggerInstall();
    setVisible(false);
    setTimeout(() => setDismissed(true), 400);
  };

  // Don't render if not installable, already a PWA, or dismissed this session
  if (!canInstall || isInstalled || dismissed) return null;

  return (
    <div
      className={`fixed top-20 right-4 z-[100] w-[320px] transition-all duration-400 ease-out ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-3 scale-95 pointer-events-none"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Volt Green top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="shrink-0 h-10 w-10 rounded-xl bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[hsl(var(--foreground))] leading-snug">
                Add ST-Finance to your home screen
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">
                Install the app for instant access — works just like a native app, no app store needed.
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              id="pwa-toast-dismiss"
              aria-label="Dismiss install prompt"
              className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 pl-[52px]">
            <button
              onClick={handleInstall}
              id="pwa-toast-install-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:shadow-[0_0_12px_rgba(57,255,20,0.35)] transition-all"
            >
              <Download className="h-3 w-3" />
              Install App
            </button>
            <button
              onClick={handleDismiss}
              id="pwa-toast-later-btn"
              className="px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
