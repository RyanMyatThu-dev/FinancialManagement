"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallToast() {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkIOS = () => {
      if (typeof window === "undefined") return false;
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      return /iphone|ipad|ipod/.test(userAgent) && !isStandalone;
    };
    setIsIOS(checkIOS());
  }, []);

  const shouldPrompt = canInstall || isIOS;

  // Slide in after 2.5s delay, only if installable/iOS and not already installed/dismissed
  useEffect(() => {
    if (!shouldPrompt || isInstalled || dismissed) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [shouldPrompt, isInstalled, dismissed]);

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
  if (!shouldPrompt || isInstalled || dismissed) return null;

  return (
    <div
      className={`fixed z-[100] transition-all duration-500 ease-out ${
        isIOS
          ? "bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[340px]"
          : "top-20 right-4 w-[320px]"
      } ${
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Pulsing indicator line for iOS, solid for desktop */}
        <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${
          isIOS 
            ? "bg-[hsl(var(--primary))] animate-pulse" 
            : "bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent"
        }`} />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* App icon */}
            <div className="shrink-0 h-10 w-10 rounded-xl bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[hsl(var(--foreground))] leading-snug">
                {isIOS ? "Install ST-Finance on iPhone" : "Add ST-Finance to your home screen"}
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">
                {isIOS 
                  ? "Tap the Share button in Safari and select 'Add to Home Screen' to launch it as an app."
                  : "Install the app for instant access — works just like a native app, no app store needed."}
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
          {!isIOS && (
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
          )}
        </div>
      </div>
    </div>
  );
}
