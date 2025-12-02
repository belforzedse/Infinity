import { atom } from "jotai";

/**
 * Tracks items that have been optimistically deleted (soft-deleted UI-side)
 * Each entry: { id: string, removedAt: string, undoTimeout: NodeJS.Timeout }
 */
export const optimisticallyDeletedItems = atom<
  Map<string, { id: string; removedAt: string; undoTimeout?: NodeJS.Timeout }>
>(new Map());

/**
 * Atom for triggering final delete confirmation (after undo timeout expires)
 * Usage: Set this to an item ID to confirm the deletion server-side
 */
export const pendingDeleteConfirmations = atom<Set<string>>(new Set<string>());

/**
 * Hook state for undo notifications
 * Maps item IDs to their undo toast IDs for dismissal
 */
export const undoToastIds = atom<Map<string, string>>(new Map());
