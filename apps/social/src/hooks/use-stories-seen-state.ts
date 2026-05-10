"use client";

import { useState, useEffect, useCallback } from "react";
import { getMySeenStoryIds, markStorySeen } from "@/services/story.service";

const LS_KEY = "story_seen_ids";

function readLocalSeenIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as number[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSeenIds(ids: number[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    // storage full or private mode
  }
}

/**
 * Seen IDs: localStorage for guests; merge + POST mark for authenticated users (storefront parity).
 */
export function useStoriesSeenState(isAuthenticated: boolean) {
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const localIds = readLocalSeenIds();
    if (!localIds.length) return;
    queueMicrotask(() => {
      setSeenIds((prev) => {
        const merged = new Set<number>();
        Array.from(prev).forEach((id) => merged.add(id));
        localIds.forEach((id) => merged.add(id));
        return merged;
      });
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const serverIds = await getMySeenStoryIds();
        queueMicrotask(() => {
          setSeenIds((prev) => {
            const merged = new Set<number>();
            Array.from(prev).forEach((id) => merged.add(id));
            serverIds.forEach((id) => merged.add(id));
            writeLocalSeenIds(Array.from(merged));
            return merged;
          });
        });
      } catch {
        // keep local only
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
          // local state already updated
        }
      }
    },
    [isAuthenticated],
  );

  const hasSeen = useCallback((storyId: number) => seenIds.has(storyId), [seenIds]);

  return { seenIds, markSeen, hasSeen };
}
