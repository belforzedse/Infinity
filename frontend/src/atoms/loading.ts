import { atom } from "jotai";
import jotaiStore from "@/lib/jotaiStore";
import { startTransition } from "react";

// Tracks the number of in-flight API requests
export const pendingRequestsAtom = atom(0);

// Derived: whether any global loading is happening
export const isGlobalLoadingAtom = atom((get) => get(pendingRequestsAtom) > 0);

// Utility to adjust pending count from anywhere (e.g., services)
export function adjustPendingRequests(delta: number) {
  const store = jotaiStore;
  const current = store.get(pendingRequestsAtom);
  const next = Math.max(0, current + delta);
  store.set(pendingRequestsAtom, next);
}

// Navigation progress (SPA route changes)
export const navigationInProgressAtom = atom(false);

export function setNavigationInProgress(v: boolean) {
  const store = jotaiStore;
  // Defer updates to avoid scheduling during insertion effects
  // which can happen if callers run inside early lifecycle hooks.
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      startTransition(() => {
        store.set(navigationInProgressAtom, v);
      });
    }, 0);
  } else {
    // Fallback for non-DOM environments
    startTransition(() => {
      store.set(navigationInProgressAtom, v);
    });
  }
}
