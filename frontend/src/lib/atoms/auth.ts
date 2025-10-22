/**
 * Global Authentication State
 * Single source of truth for authenticated user across the entire app
 * Prevents multiple redundant API calls to /users/me endpoint
 */

import { atom } from "jotai";
import type { MeResponse } from "@/services/user/me";

// Global atom for current user - shared across all components
export const currentUserAtom = atom<MeResponse | null>(null);

// Atom to track if we've attempted to load the user (prevents infinite loops)
export const userLoadingAtom = atom<boolean>(false);

// Atom to track auth loading errors
export const userErrorAtom = atom<Error | null>(null);
