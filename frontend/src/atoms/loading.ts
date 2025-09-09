import { atom } from "jotai";
import jotaiStore from "@/lib/jotaiStore";

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
  store.set(navigationInProgressAtom, v);
}
