"use client";

import { useEffect } from "react";

export default function ImageEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyEffects = (img: HTMLImageElement) => {
      if (!img) return;
      // Ensure lazy loading on plain <img>
      if (!img.getAttribute("loading")) {
        img.setAttribute("loading", "lazy");
      }
      // Skip if already marked loaded
      if (img.classList.contains("img-loaded")) return;
      // If already complete from cache, mark loaded immediately
      if (img.complete) {
        img.classList.add("img-loaded");
        return;
      }
      // Add listener to mark as loaded when finished
      const onLoad = () => {
        img.classList.add("img-loaded");
        img.removeEventListener("load", onLoad);
      };
      img.addEventListener("load", onLoad);
    };

    // Initial pass
    document.querySelectorAll<HTMLImageElement>("img").forEach(applyEffects);

    // Observe for new images
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            applyEffects(node);
          } else if (node instanceof HTMLElement) {
            node.querySelectorAll("img").forEach((img) => applyEffects(img));
          }
        });
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

