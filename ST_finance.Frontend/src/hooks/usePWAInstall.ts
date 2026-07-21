"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

// Extend window type to include our globally captured prompt
declare global {
  interface Window {
    __pwaInstallPrompt: BeforeInstallPromptEvent | null;
  }
}

interface UsePWAInstallReturn {
  canInstall: boolean;
  isInstalled: boolean;
  triggerInstall: () => Promise<void>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // ── Detect if already running as a standalone PWA ──
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const isStandalone = standaloneQuery.matches || (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      setCanInstall(false);
      return;
    }

    // ── Check if the event was already captured before React mounted ──
    // The inline script in layout.tsx stores it on window.__pwaInstallPrompt
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
      setCanInstall(true);
    }

    // ── Also listen for the custom event fired by the inline script ──
    // This covers the case where beforeinstallprompt fires after React mounts
    const handleReady = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
        setCanInstall(true);
      }
    };

    // ── Direct listener as final fallback ──
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = prompt;
      setDeferredPrompt(prompt);
      setCanInstall(true);
    };

    // ── Listen for successful installation ──
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
    };

    window.addEventListener("pwaInstallReady", handleReady);
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pwaInstallReady", handleReady);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    const prompt = deferredPrompt ?? window.__pwaInstallPrompt;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanInstall(false);
    }

    setDeferredPrompt(null);
    window.__pwaInstallPrompt = null;
  }, [deferredPrompt]);

  return { canInstall, isInstalled, triggerInstall };
}
