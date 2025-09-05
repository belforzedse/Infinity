"use client";

import { useEffect } from "react";

export default function ImageEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Defer DOM mutations to after hydration to avoid className mismatches
    const schedule =
      (window as any).requestIdleCallback ||
      ((cb: Function) => setTimeout(cb as any, 0));
    const cancel =
      (window as any).cancelIdleCallback ||
      ((id: number) => clearTimeout(id));

    const idleId = schedule(() => {
      const applyEffects = (img: HTMLImageElement) => {
        if (!img) return;
        // Ensure lazy loading on plain <img>
        if (!img.getAttribute("loading")) {
          img.setAttribute("loading", "lazy");
        }
        // Skip if already marked loaded
        if (img.classList.contains("img-loaded")) return;
        // Prefer listening for load to avoid immediate class flips during hydration
        const onLoad = () => {
          img.classList.add("img-loaded");
          img.removeEventListener("load", onLoad);
        };
        img.addEventListener("load", onLoad);
        // If cached and already complete, mark in next frame to avoid hydration mismatch
        if (img.complete) {
          requestAnimationFrame(() => {
            img.classList.add("img-loaded");
          });
        }
      };

      // Initial pass
      document
        .querySelectorAll<HTMLImageElement>("img")
        .forEach(applyEffects);

      // Observe for new images
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLImageElement) {
              applyEffects(node);
            } else if (node instanceof HTMLElement) {
              node
                .querySelectorAll("img")
                .forEach((img) => applyEffects(img));
            }
          });
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      cleanup = () => observer.disconnect();
    });

    let cleanup: (() => void) | undefined;
    return () => {
      if (cleanup) cleanup();
      try {
        cancel(idleId);
      } catch {}
    };
  }, []);

  return null;
}

