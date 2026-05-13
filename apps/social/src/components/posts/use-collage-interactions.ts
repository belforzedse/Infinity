"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { HomeFeedPost } from "@/services/feed-post.service";
import { getLikedPostIds, hasAccessToken, togglePostLike } from "@/services/post-like.service";
import { getBookmarkedPostIds, togglePostBookmark } from "@/services/post-bookmark.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export function useCollageInteractions(
  posts: readonly HomeFeedPost[],
  likeMode: "local" | "api",
  onSavedChange?: (postId: string, isSaved: boolean) => void,
) {
  const [liked, setLiked] = useState<Readonly<Record<string, boolean>>>({});
  const [savedPostIds, setSavedPostIds] = useState<readonly string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Readonly<Record<string, number>>>({});
  const [pendingLikes, setPendingLikes] = useState<Readonly<Record<string, boolean>>>({});
  const [pendingSaves, setPendingSaves] = useState<Readonly<Record<string, boolean>>>({});
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

  useEffect(() => {
    if (!hasAccessToken()) {
      setSavedPostIds([]);
      return;
    }

    let cancelled = false;
    getBookmarkedPostIds()
      .then((ids) => {
        if (!cancelled) setSavedPostIds([...ids]);
      })
      .catch(() => {
        if (!cancelled) setSavedPostIds([]);
      });

    return () => {
      cancelled = true;
    };
  }, [posts]);

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

  const toggleSaved = useCallback(
    async (id: string) => {
      if (!hasAccessToken()) {
        toast.error("برای ذخیره پست ابتدا وارد حساب کاربری شوید.");
        return;
      }

      if (pendingSaves[id]) return;

      const wasSaved = savedPostIds.includes(id);
      const nextSaved = !wasSaved;
      setPendingSaves((prev) => ({ ...prev, [id]: true }));
      setSavedPostIds((prev) => {
        if (nextSaved) return prev.includes(id) ? prev : [id, ...prev];
        return prev.filter((postId) => postId !== id);
      });

      try {
        const result = await togglePostBookmark(id);
        setSavedPostIds((prev) => {
          if (result.isBookmarked) return prev.includes(id) ? prev : [id, ...prev];
          return prev.filter((postId) => postId !== id);
        });
        onSavedChange?.(id, result.isBookmarked);
      } catch (error: unknown) {
        setSavedPostIds((prev) => {
          if (wasSaved) return prev.includes(id) ? prev : [id, ...prev];
          return prev.filter((postId) => postId !== id);
        });
        setShakeIds((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
        toast.error(getUserFacingErrorMessage(error, "ذخیره پست ناموفق بود."));
      } finally {
        setPendingSaves((prev) => ({ ...prev, [id]: false }));
      }
    },
    [onSavedChange, pendingSaves, savedPostIds],
  );

  return { liked, saved, likeCounts, pendingLikes, shakeIds, toggleLiked, toggleSaved };
}
