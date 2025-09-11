"use client";

import { useEffect } from "react";

export default function PreloadBlur() {
  useEffect(() => {
    // Remove the initial blur class once the app hydrates on the client
    const el = document?.body;
    if (!el) return;
    // Allow a microtask so paint happens with blur first, then remove for a smooth transition
    const id = setTimeout(() => {
      el.classList.remove("preload-blur");
    }, 0);
    return () => clearTimeout(id);
  }, []);

  return null;
}

