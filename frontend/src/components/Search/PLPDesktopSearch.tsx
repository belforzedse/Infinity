"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "./Icons/SearchIcon";
import { API_BASE_URL, IMAGE_BASE_URL, ENDPOINTS } from "@/constants/api";
import { motion, AnimatePresence } from "framer-motion";
import SearchSuggestionCard from "./SearchSuggestionCard";

type Suggestion = {
  id: number;
  Title: string;
  Price?: number;
  DiscountPrice?: number;
  Discount?: number;
  category?: string;
  image?: string;
  isAvailable?: boolean;
};

interface PLPDesktopSearchProps {
  className?: string;
}

const PLPDesktopSearch: React.FC<PLPDesktopSearchProps> = ({ className = "" }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const POPULAR_QUERIES = useMemo(
    () => ["کیف", "کفش", "کتونی", "لباس زنانه", "پرفروش"],
    [],
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 6));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const persistRecent = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 6);
      localStorage.setItem("recentSearches", JSON.stringify(next));
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't search if query is empty
    if (!searchQuery.trim()) return;

    persistRecent(searchQuery);

    // Redirect to search results page with the query
    router.push(`/plp?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Debounced live search suggestions (native fetch to avoid global overlays)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    setActiveIndex(-1);

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      if (isFocused) setOpen(true);
      return;
    }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const url = `${API_BASE_URL}${ENDPOINTS.PRODUCT.SEARCH}?q=${encodeURIComponent(q)}&page=1&pageSize=6&_skip_global_loader=1`;
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!mounted) return;
        const json = await res.json();

        // Debug: Log the response
        console.log("Search API response:", json);

        const items = (json?.data || []).map((raw: any) => {
          const attrs = raw?.attributes ? raw.attributes : raw;
          const id = raw.id;
          const title = attrs?.Title ?? raw?.Title;

          // Compute image URL (prefer thumbnail/small for preview; fallback to original and nested shapes)
          const img: any = attrs?.CoverImage;
          const thumb = img?.formats?.thumbnail?.url || img?.formats?.small?.url;
          const original = img?.url || img?.data?.attributes?.url;
          const imageUrl = thumb
            ? `${IMAGE_BASE_URL}${thumb}`
            : original
              ? `${IMAGE_BASE_URL}${original}`
              : undefined;

          // Category title from possible shapes
          const categoryTitle =
            attrs?.product_main_category?.Title ??
            attrs?.product_category?.Title ??
            attrs?.product_category?.data?.attributes?.Title ??
            undefined;

          const item: Suggestion = {
            id,
            Title: title,
            Price: attrs?.Price ?? undefined,
            DiscountPrice: attrs?.DiscountPrice ?? undefined,
            Discount: attrs?.Discount ?? undefined,
            category: categoryTitle,
            image: imageUrl,
            isAvailable: attrs?.IsAvailable ?? true,
          };
          return item;
        }) as Suggestion[];
        // Deduplicate by id to avoid React key collisions if API returns duplicates
        const unique: Suggestion[] = Array.from(
          new Map<number, Suggestion>(items.map((it) => [it.id, it])).values(),
        );
        setSuggestions(unique);
        setOpen(unique.length > 0);
      } catch {
        if (!mounted) return;
        setSuggestions([]);
        setOpen(false);
        // Silently ignore; console already logs in service
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
      controller.abort();
    };
  }, [isFocused, searchQuery]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = suggestions[activeIndex];
      if (item) router.push(`/pdp/${item.id}`);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      ref={containerRef}
      className={`relative flex w-[320px] items-center justify-between rounded-[28px] border border-slate-200 bg-white py-2 pl-2 pr-4 shadow-sm focus-within:ring-2 focus-within:ring-pink-200 md:w-[360px] lg:w-[420px] ${className}`}
      animate={{ scale: isFocused ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <div className="flex w-full items-center justify-between px-2">
        <input
          type="text"
          name="search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            // Give time for clicks inside dropdown
            setTimeout(() => {
              if (!open) setIsFocused(false);
            }, 80);
          }}
          onKeyDown={onKeyDown}
          placeholder="دنبال چی میگردی؟"
          className="text-sm flex-1 bg-transparent text-right text-neutral-600 placeholder-neutral-400 outline-none"
          role="combobox"
          aria-expanded={open}
          aria-controls="plp-desktop-suggestions"
        />

        <motion.button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 shadow-sm"
          whileTap={{ scale: 0.95 }}
        >
          <SearchIcon className="h-5 w-5 text-white" />
        </motion.button>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-0 top-full z-[1000] mt-2 max-h-96 w-full min-w-[320px] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-neutral-800 shadow-xl"
            role="listbox"
            aria-label="پیشنهادهای جستجو"
          >
            {searchQuery.trim().length < 2 && !loading ? (
              <div className="flex flex-col gap-2 p-3 text-right text-sm text-neutral-600">
                {recentSearches.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-neutral-500">جستجوهای اخیر</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                            setOpen(false);
                            router.push(`/plp?search=${encodeURIComponent(term)}`);
                          }}
                          className="text-xs rounded-full border border-slate-200 px-3 py-1 text-pink-600 hover:border-pink-300 hover:bg-pink-50"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-neutral-500">جستجوهای محبوب</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {POPULAR_QUERIES.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchQuery(term);
                          setOpen(false);
                          router.push(`/plp?search=${encodeURIComponent(term)}`);
                        }}
                        className="text-xs rounded-full border border-slate-200 px-3 py-1 text-neutral-600 hover:border-pink-300 hover:bg-pink-50"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-neutral-500">
                  <span>برای جستجوی سریع‌تر از کلید‌های جهت‌دار استفاده کنید</span>
                  <span className="font-medium text-slate-400">↕ / ↵</span>
                </div>
              </div>
            ) : (
              <>
                {loading && <div className="text-xs px-3 py-2 text-neutral-500">در حال جستجو…</div>}
                {!loading && suggestions.length === 0 && (
                  <div className="text-xs px-3 py-2 text-neutral-500">موردی یافت نشد</div>
                )}
                {!loading &&
                  suggestions.map((s, idx) => (
                    <SearchSuggestionCard
                      key={s.id}
                      id={s.id}
                      title={s.Title}
                      price={s.Price}
                      discountPrice={s.DiscountPrice}
                      discount={s.Discount}
                      category={s.category}
                      image={s.image}
                      isAvailable={s.isAvailable}
                      onClick={() => {
                        persistRecent(s.Title);
                        router.push(`/pdp/${s.id}`);
                      }}
                      index={idx}
                      isActive={activeIndex === idx}
                      query={searchQuery.trim()}
                    />
                  ))}
                {!loading && suggestions.length > 0 && (
                  <motion.button
                    type="button"
                    onClick={() => {
                      persistRecent(searchQuery);
                      router.push(`/plp?search=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className="text-xs block w-full border-t border-slate-200 bg-white/0 px-3 py-2 text-right text-pink-600 hover:bg-slate-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    مشاهده همه نتایج
                  </motion.button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
};

export default PLPDesktopSearch;
