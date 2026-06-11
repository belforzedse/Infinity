"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchIcon from "./Icons/SearchIcon";
import { API_BASE_URL, IMAGE_BASE_URL, ENDPOINTS } from "@/constants/api";
import SearchSuggestionCard from "./SearchSuggestionCard";
// Site search is tracked natively on the results page (PLP), where the real
// result count is known — see components/Analytics/SiteSearchTracker.

type Suggestion = {
  id: number;
  slug?: string;
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
  const pathname = usePathname();
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const POPULAR_QUERIES = useMemo(
    () => ["کیف", "کفش", "کتونی", "لباس زنانه", "پرفروش"],
    [],
  );

  const getSearchHref = (term: string) => {
    const basePath = pathname.startsWith("/plp/category/") ? pathname : "/plp";
    return `${basePath}?search=${encodeURIComponent(term)}`;
  };

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
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    persistRecent(searchQuery);

    // Redirect to search results page with the query (site search is tracked there).
    router.push(getSearchHref(trimmed));
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
        const url = `${API_BASE_URL}${ENDPOINTS.PRODUCT.SEARCH}?q=${encodeURIComponent(q)}&page=1&pageSize=6&view=suggestion&_skip_global_loader=1`;
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!mounted) return;
        const json = await res.json();

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
            slug: attrs?.Slug ?? undefined,
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
      if (item) router.push(`/pdp/${item.slug || item.id}`);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isExpanded = isFocused || open;

  return (
    <form
      onSubmit={handleSubmit}
      ref={containerRef}
      className={[
        "relative rounded-[28px] border border-slate-50 bg-stone-50 shadow-sm",
        "transition-all duration-300 ease-out",
        "focus-within:border-zinc-200 focus-within:ring-2 focus-within:ring-infinity-primary-lighter/60",
        isExpanded ? "w-[360px] lg:w-[420px]" : "w-[282px]",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2 py-2 pl-2 pr-5" dir="ltr">
        <button
          type="submit"
          className="flex h-8 w-9 shrink-0 items-center justify-center rounded-[28px] bg-infinity-primary shadow-sm transition-transform duration-200 hover:scale-105 active:scale-95"
          aria-label="جستجو"
        >
          <SearchIcon className="h-5 w-5" />
        </button>

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
            setTimeout(() => {
              if (!open) setIsFocused(false);
            }, 80);
          }}
          onKeyDown={onKeyDown}
          placeholder="دنبال چی میگردی؟"
          dir="rtl"
          className="min-w-0 flex-1 bg-transparent text-right text-xs leading-[21px] text-neutral-600 placeholder:text-neutral-400 outline-none"
          role="combobox"
          aria-expanded={open}
          aria-controls="plp-desktop-suggestions"
        />
      </div>

      {/* Suggestions dropdown */}
      {open && (
        <div
          className="absolute inset-x-0 top-full z-[1000] mt-2 max-h-96 w-full min-w-[282px] overflow-y-auto rounded-2xl border border-slate-200 bg-white text-neutral-800 shadow-xl duration-200 animate-in fade-in slide-in-from-top-2"
          role="listbox"
          aria-label="پیشنهادهای جستجو"
          id="plp-desktop-suggestions"
        >
            {/* Screen reader announcement for result count */}
            {!loading && suggestions.length > 0 && (
              <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {suggestions.length} نتیجه یافت شد برای "{searchQuery.trim()}"
              </div>
            )}
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
                            router.push(getSearchHref(term));
                          }}
                          className="pressable text-xs rounded-full border border-slate-200 px-3 py-1 text-infinity-primary hover:border-infinity-primary-lighter hover:bg-infinity-primary-lighter/20"
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
                          router.push(getSearchHref(term));
                        }}
                        className="pressable text-xs rounded-full border border-slate-200 px-3 py-1 text-neutral-600 hover:border-infinity-primary-lighter hover:bg-infinity-primary-lighter/20"
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
                {loading && (
                  <div className="space-y-2 px-3 py-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="skeleton-shimmer h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton-shimmer-light h-3 w-2/3 rounded" />
                          <div className="skeleton-shimmer-light h-3 w-1/3 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!loading && suggestions.length === 0 && (
                  <div className="text-xs px-3 py-2 text-neutral-500">موردی یافت نشد</div>
                )}
                {!loading &&
                  suggestions.map((s, idx) => (
                    <div
                      key={s.id}
                      role="option"
                      aria-selected={activeIndex === idx}
                      aria-label={`${s.Title} - ${s.Price ? `${s.Price} تومان` : ''}`}
                    >
                      <SearchSuggestionCard
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
                          router.push(`/pdp/${s.slug || s.id}`);
                        }}
                        index={idx}
                        isActive={activeIndex === idx}
                        query={searchQuery.trim()}
                      />
                    </div>
                  ))}
                {!loading && suggestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      persistRecent(searchQuery);
                      router.push(getSearchHref(searchQuery.trim()));
                    }}
                    className="text-xs block w-full border-t border-slate-200 bg-white/0 px-3 py-2 text-right text-infinity-primary hover:bg-slate-50"
                  >
                    مشاهده همه نتایج
                  </button>
                )}
              </>
            )}
        </div>
      )}
    </form>
  );
};

export default PLPDesktopSearch;
