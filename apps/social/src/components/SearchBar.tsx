"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Images, Search, X } from "lucide-react";
import { BlurImage } from "@/components/ui/BlurImage";
import { searchPosts, SEARCH_SUGGESTION_LIMIT } from "@/services/search.service";
import type { HomeFeedPost } from "@/services/feed-post.service";

function cx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

export type SearchBarProps = {
  /** Placeholder / label text (Persian UI). */
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

const RECENTS_KEY = "social:recent-searches";
const MAX_RECENTS = 8;
const POPULAR_QUERIES = ["استایل", "لباس", "کیف", "کفش", "اینفینیتی"] as const;

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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENTS_KEY, JSON.stringify(queries));
}

function highlightTitle(title: string, query: string) {
  const q = query.trim();
  if (!q) return title;
  const lowerTitle = title.toLocaleLowerCase("fa-IR");
  const lowerQuery = q.toLocaleLowerCase("fa-IR");
  const index = lowerTitle.indexOf(lowerQuery);
  if (index < 0) return title;

  const before = title.slice(0, index);
  const match = title.slice(index, index + q.length);
  const after = title.slice(index + q.length);
  return (
    <>
      {before}
      <mark className="bg-transparent px-0 text-[#3D4C6E]">{match}</mark>
      {after}
    </>
  );
}

function SuggestionRow({
  post,
  query,
  active,
  onSelect,
}: {
  post: HomeFeedPost;
  query: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cx(
        "flex w-full flex-row items-center gap-3 px-3 py-2 text-right transition-colors",
        active ? "bg-[#F3F6FC]" : "hover:bg-slate-50",
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {post.imageSrc ? (
          <BlurImage
            src={post.imageSrc}
            alt={post.imageAlt || post.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#94A3B8]">
            <Images className="size-5" strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-peyda text-sm font-semibold text-[#424242]">
          {highlightTitle(post.title || "پست", query)}
        </p>
        <p className="mt-0.5 line-clamp-1 font-peyda text-xs text-[#94A3B8]">
          {post.imageAlt || "پست اینفینیتی"}
        </p>
      </div>
    </button>
  );
}

/**
 * Header search control — Figma `Frame 92960` / inner `92959` (white pill, 268×44, 24px search glyph).
 * No horizontal auto-margin so it can sit flush start in the header; pass `className="mx-auto"` if you need it centered.
 */
export function SearchBar({
  placeholder = "دنبال چی میگردی؟",
  className,
  "aria-label": ariaLabel = "جستجوی پست‌ها",
}: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLFormElement | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<readonly HomeFeedPost[]>([]);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setRecentQueries(readRecents().slice(0, MAX_RECENTS));
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const persistRecent = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setRecentQueries((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, MAX_RECENTS);
      writeRecents(next);
      return next;
    });
  }, []);

  const goToSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      persistRecent(trimmed);
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [persistRecent, router],
  );

  const openPost = useCallback(
    (post: HomeFeedPost) => {
      persistRecent(query || post.title);
      setIsOpen(false);
      router.push(`/post/${encodeURIComponent(post.slug)}`);
    },
    [persistRecent, query, router],
  );

  useEffect(() => {
    let cancelled = false;
    const activeResetId = window.setTimeout(() => {
      if (!cancelled) setActiveIndex(-1);
    }, 0);

    const q = query.trim();
    if (q.length < 2) {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        setSuggestions([]);
        setIsLoading(false);
        if (isFocused) setIsOpen(true);
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(activeResetId);
        window.clearTimeout(id);
      };
    }

    const abortController = new AbortController();
    const loadingId = window.setTimeout(() => {
      if (!cancelled) setIsLoading(true);
    }, 0);
    const id = window.setTimeout(() => {
      searchPosts(q, {
        limit: SEARCH_SUGGESTION_LIMIT,
        signal: abortController.signal,
      })
        .then((posts) => {
          if (!cancelled) {
            const unique = Array.from(
              new Map(posts.map((post) => [post.id, post])).values(),
            );
            setSuggestions(unique);
            setIsOpen(true);
          }
        })
        .catch(() => {
          if (!cancelled && !abortController.signal.aborted) {
            setSuggestions([]);
            setIsOpen(false);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      abortController.abort();
      window.clearTimeout(activeResetId);
      window.clearTimeout(loadingId);
      window.clearTimeout(id);
    };
  }, [isFocused, query]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const chipQueries = useMemo(
    () => (recentQueries.length > 0 ? recentQueries : [...POPULAR_QUERIES]),
    [recentQueries],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      openPost(suggestions[activeIndex]);
      return;
    }
    goToSearch(query);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    }
  }

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      dir="rtl"
      className={cx(
        "relative box-border flex h-[44px] w-[268px] flex-col items-end justify-center gap-[10px] rounded-[40px] bg-white p-[10px]",
        "text-right transition-shadow focus-within:shadow-[0_0_0_1px_#94A3B8]",
        className,
      )}
    >
      <span className="flex h-6 w-full flex-row items-center justify-end gap-1">
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:text-[#3D4C6E]"
          aria-label="جستجو"
        >
          <Search
            size={24}
            strokeWidth={1.2}
            aria-hidden
          />
        </button>
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-right font-peyda text-xs font-normal leading-[21px] text-[#424242] outline-none placeholder:text-[#A3A3A3]"
          placeholder={placeholder}
          aria-label={ariaLabel}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="social-header-search-suggestions"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setIsOpen(true);
            }}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[#94A3B8] transition-colors hover:bg-slate-50 hover:text-zinc-700"
            aria-label="پاک کردن جستجو"
          >
            <X className="size-3.5" strokeWidth={1.7} aria-hidden />
          </button>
        ) : null}
      </span>

      {isOpen ? (
        <div
          id="social-header-search-suggestions"
          role="listbox"
          aria-label="پیشنهادهای جستجو"
          className="absolute inset-x-0 top-full z-[1000] mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-100 bg-white py-2 text-right shadow-xl"
        >
          {query.trim().length < 2 ? (
            <div className="flex flex-col gap-3 px-3 py-2 font-peyda text-sm">
              <div>
                <span className="text-xs font-semibold text-[#94A3B8]">
                  {recentQueries.length > 0 ? "جستجوهای اخیر" : "جستجوهای محبوب"}
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {chipQueries.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => goToSearch(term)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-[#3D4C6E] transition-colors hover:border-[#94A3B8] hover:bg-slate-50"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="px-3 py-3 font-peyda text-xs text-[#94A3B8]">در حال جستجو...</div>
              ) : suggestions.length === 0 ? (
                <div className="px-3 py-3 font-peyda text-xs text-[#94A3B8]">موردی یافت نشد</div>
              ) : (
                suggestions.map((post, index) => (
                  <SuggestionRow
                    key={post.id}
                    post={post}
                    query={query}
                    active={activeIndex === index}
                    onSelect={() => openPost(post)}
                  />
                ))
              )}

              {!isLoading && suggestions.length > 0 ? (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goToSearch(query)}
                  className="mt-1 block w-full border-t border-slate-100 px-3 py-2 text-right font-peyda text-xs font-semibold text-[#3D4C6E] transition-colors hover:bg-slate-50"
                >
                  مشاهده همه نتایج
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </form>
  );
}
