"use client";

import { useState, useEffect, useCallback } from "react";
import { getMySeenStoryIds, markStorySeen } from "@/services/story/story.service";

const LS_KEY = "story_seen_ids";

function readLocalSeenIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as number[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSeenIds(ids: number[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    // storage full or private mode — silent fail
  }
}

/**
 * Manages the set of seen story IDs.
 * - Guests: localStorage only.
 * - Authenticated users: merges localStorage with server-side list on mount,
 *   then calls the API on each markSeen.
 */
export function useStoriesSeenState(isAuthenticated: boolean) {
  // Start with an empty set so SSR and first client render match exactly.
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());

  // Hydrate local seen IDs after mount (client only).
  useEffect(() => {
    const localIds = readLocalSeenIds();
    if (!localIds.length) return;
    setSeenIds((prev) => {
      const merged = new Set<number>();
      Array.from(prev).forEach((id) => merged.add(id));
      localIds.forEach((id) => merged.add(id));
      return merged;
    });
  }, []);

  // Merge server-side seen IDs for authenticated users
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const serverIds = await getMySeenStoryIds();
        setSeenIds((prev) => {
          const merged = new Set<number>();
          Array.from(prev).forEach((id) => merged.add(id));
          serverIds.forEach((id) => merged.add(id));
          writeLocalSeenIds(Array.from(merged));
          return merged;
        });
      } catch {
        // network error — silently keep local state
      }
    })();
  }, [isAuthenticated]);

  const markSeen = useCallback(
    async (storyId: number) => {
      setSeenIds((prev) => {
        if (prev.has(storyId)) return prev;
        const next = new Set(prev);
        next.add(storyId);
        writeLocalSeenIds(Array.from(next));
        return next;
      });

      if (isAuthenticated) {
        try {
          await markStorySeen(storyId);
        } catch {
          // network error — local state already updated
        }
      }
    },
    [isAuthenticated]
  );

  const hasSeen = useCallback((storyId: number) => seenIds.has(storyId), [seenIds]);

  return { seenIds, markSeen, hasSeen };
}
