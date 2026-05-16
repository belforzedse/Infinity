"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { Header } from "@/components/Header";
import { HomePostsCollageSkeleton } from "@/components/posts/HomePostsCollageSkeleton";
import { RecentQueriesRow } from "@/components/search/RecentQueriesRow";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchResultsGrid } from "@/components/search/SearchResultsGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSmoothLoading } from "@/hooks/useSmoothLoading";
import { searchPosts, SEARCH_RESULTS_PAGE_SIZE } from "@/services/search.service";
import type { HomeFeedPost } from "@/services/feed-post.service";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

const RECENTS_KEY = "social:recent-searches";
const MAX_RECENTS = 8;

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeRecents(queries: readonly string[]) {
  window.localStorage.setItem(RECENTS_KEY, JSON.stringify(queries));
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [recentQueries, setRecentQueries] = useState<string[]>(readRecents);
  const [results, setResults] = useState<readonly HomeFeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showLoading = useSmoothLoading(isLoading, { showDelayMs: 80, minVisibleMs: 240 });

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    setDebouncedQuery(q);
    if (!q.trim()) {
      setResults([]);
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) return;

    let cancelled = false;
    const abortController = new AbortController();
    const loadingTimer = window.setTimeout(() => {
      if (!cancelled) setIsLoading(true);
    }, 0);
    searchPosts(q, {
      limit: SEARCH_RESULTS_PAGE_SIZE,
      signal: abortController.signal,
    })
      .then((posts) => {
        if (!cancelled) {
          setResults(posts);
          setRecentQueries((prev) => {
            const next = [q, ...prev.filter((item) => item !== q)].slice(0, MAX_RECENTS);
            writeRecents(next);
            return next;
          });
        }
      })
      .catch((error: unknown) => {
        if (cancelled || abortController.signal.aborted) return;
        toast.error(
          getUserFacingErrorMessage(error, "جستجو ناموفق بود. دوباره تلاش کنید."),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      abortController.abort();
      window.clearTimeout(loadingTimer);
    };
  }, [debouncedQuery]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setDebouncedQuery("");
      setResults([]);
      setIsLoading(false);
    }
  }, []);

  const removeRecent = useCallback((value: string) => {
    setRecentQueries((prev) => {
      const next = prev.filter((item) => item !== value);
      writeRecents(next);
      return next;
    });
  }, []);

  const hasQuery = debouncedQuery.trim().length > 0;
  const stateView = useMemo(() => {
    if (!hasQuery) {
      return (
        <EmptyState
          icon={Search}
          title="جستجو کنید"
          description="نام پست، عنوان یا کلیدواژه موردنظرتان را وارد کنید."
        />
      );
    }

    if (isLoading) return showLoading ? <HomePostsCollageSkeleton /> : null;

    if (results.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title="نتیجه‌ای پیدا نشد"
          description="عبارت دیگری را امتحان کنید یا بعدا دوباره جستجو کنید."
        />
      );
    }

    return <SearchResultsGrid posts={results} />;
  }, [hasQuery, isLoading, results, showLoading]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-5 pb-6 pt-6 sm:px-6 lg:px-[60px] lg:pb-12">
        <div className="flex flex-col items-end gap-4">
          <h1 className="font-peyda text-lg font-semibold text-zinc-800 lg:text-xl">
            جستجو
          </h1>
          <SearchInput
            value={query}
            onValueChange={handleQueryChange}
            onDebouncedValueChange={setDebouncedQuery}
          />
          <RecentQueriesRow
            queries={recentQueries}
            onSelect={(value) => {
              setQuery(value);
              setDebouncedQuery(value);
            }}
            onRemove={removeRecent}
          />
        </div>
        {stateView}
      </main>
    </div>
  );
}
