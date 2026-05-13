"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import toast from "react-hot-toast";
import { savedPostIdsAtom } from "@/lib/saved-posts-atom";
import type { HomeFeedPost } from "@/services/feed-post.service";
import { getLikedPostIds, hasAccessToken, togglePostLike } from "@/services/post-like.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export function useCollageInteractions(posts: readonly HomeFeedPost[], likeMode: "local" | "api") {
  const [liked, setLiked] = useState<Readonly<Record<string, boolean>>>({});
  const [savedPostIds, setSavedPostIds] = useAtom(savedPostIdsAtom);
  const [likeCounts, setLikeCounts] = useState<Readonly<Record<string, number>>>({});
  const [pendingLikes, setPendingLikes] = useState<Readonly<Record<string, boolean>>>({});
  const [shakeIds, setShakeIds] = useState<Readonly<Record<string, number>>>({});

  const savedIdSet = useMemo(() => new Set(savedPostIds), [savedPostIds]);
  const saved = useMemo<Readonly<Record<string, boolean>>>(() => {
    const next: Record<string, boolean> = {};
    posts.forEach((post) => {
      if (savedIdSet.has(post.id)) next[post.id] = true;
    });
    return next;
  }, [posts, savedIdSet]);

  useEffect(() => {
    if (likeMode !== "api" || !hasAccessToken()) return;

    let cancelled = false;
    getLikedPostIds()
      .then((ids) => {
        if (cancelled) return;
        const next: Record<string, boolean> = {};
        posts.forEach((post) => {
          if (ids.has(post.id)) next[post.id] = true;
        });
        setLiked(next);
      })
      .catch(() => {
        if (!cancelled) setLiked({});
      });

    return () => {
      cancelled = true;
    };
  }, [likeMode, posts]);

  const toggleLiked = useCallback(
    async (id: string) => {
      if (likeMode === "local") {
        setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
        return;
      }

      if (!hasAccessToken()) {
        toast.error("برای پسندیدن پست ابتدا وارد حساب کاربری شوید.");
        return;
      }

      if (pendingLikes[id]) return;

      const wasLiked = Boolean(liked[id]);
      const nextLiked = !wasLiked;
      setPendingLikes((prev) => ({ ...prev, [id]: true }));
      setLiked((prev) => ({ ...prev, [id]: nextLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [id]: (prev[id] ?? posts.find((post) => post.id === id)?.likesCount ?? 0) + (nextLiked ? 1 : -1),
      }));

      try {
        const result = await togglePostLike(id);
        setLiked((prev) => ({ ...prev, [id]: result.isLiked }));
        if (result.isLiked !== nextLiked) {
          setLikeCounts((prev) => ({
            ...prev,
            [id]: Math.max(
              0,
              (prev[id] ?? posts.find((post) => post.id === id)?.likesCount ?? 0) +
                (result.isLiked ? 1 : -1),
            ),
          }));
        }
      } catch (error: unknown) {
        setLiked((prev) => ({ ...prev, [id]: wasLiked }));
        setLikeCounts((prev) => ({
          ...prev,
          [id]: posts.find((post) => post.id === id)?.likesCount ?? prev[id] ?? 0,
        }));
        setShakeIds((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
        toast.error(getUserFacingErrorMessage(error, "پسندیدن پست ناموفق بود."));
      } finally {
        setPendingLikes((prev) => ({ ...prev, [id]: false }));
      }
    },
    [likeMode, liked, pendingLikes, posts],
  );

  const toggleSaved = useCallback((id: string) => {
    setSavedPostIds((prev) => {
      if (prev.includes(id)) return prev.filter((postId) => postId !== id);
      return [id, ...prev];
    });
  }, [setSavedPostIds]);

  return { liked, saved, likeCounts, pendingLikes, shakeIds, toggleLiked, toggleSaved };
}
