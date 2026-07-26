"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

let activeModalCount = 0;

export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    activeModalCount++;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      activeModalCount--;
      if (activeModalCount <= 0) {
        activeModalCount = 0;
        document.body.style.overflow = originalOverflow || "";
      }
    };
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
