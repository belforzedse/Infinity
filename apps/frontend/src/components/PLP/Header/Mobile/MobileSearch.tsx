"use client";
import { useEffect, useState, useRef, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { API_BASE_URL, IMAGE_BASE_URL } from "@/constants/api";
import SearchSuggestionCard from "@/components/Search/SearchSuggestionCard";
import { getDeviceInfo } from "@/utils/device-detection";
import { trackSearch } from "@/lib/analytics/matomo";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearch({ isOpen, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{
      id: number;
      slug?: string;
      Title: string;
      Price?: number;
      DiscountPrice?: number;
      Discount?: number;
      category?: string;
      image?: string;
      isAvailable?: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const backdropPointerDownRef = useRef(false);
  const ignoreBackdropUntilRef = useRef(0);
  const markBackdropPointerDown = (event: SyntheticEvent<HTMLDivElement>) => {
    if (isIOS) return;
    if (event.target !== event.currentTarget) return;
    backdropPointerDownRef.current = true;
  };
  const closeModal = (options?: { force?: boolean }) => {
    const isIOSDevice = isIOS || (typeof window !== "undefined" && getDeviceInfo().isIOS);
    if (isIOSDevice && !options?.force) return;
    onClose();
  };
  const getSearchHref = (term: string) => {
    const basePath = pathname.startsWith("/plp/category/") ? pathname : "/plp";
    return `${basePath}?search=${encodeURIComponent(term)}`;
  };

  useEffect(() => {
    setMounted(true);
    setIsIOS(getDeviceInfo().isIOS);
  }, []);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCanClose(false);
      backdropPointerDownRef.current = false;
      return;
    }
    const delay = isIOS ? 600 : 200;
    const id = window.setTimeout(() => setCanClose(true), delay);
    return () => window.clearTimeout(id);
  }, [isOpen, isIOS]);

  useEffect(() => {
    if (!isOpen) return;
    if (isIOS) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [isOpen, isIOS]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canClose) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen, canClose]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't search if query is empty
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    // Close the search modal
    closeModal({ force: true });
    trackSearch(trimmed, "mobile");

    // Redirect to search results page with the query
    router.push(getSearchHref(trimmed));
  };

  // Debounced suggestions (native fetch to avoid global overlays)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        // Use the search endpoint which includes Slug field
        const url = `${API_BASE_URL}/products/search?q=${encodeURIComponent(q)}&page=1&pageSize=6&view=suggestion&_skip_global_loader=1`;
        const res = await fetch(url, {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!mounted) return;
        const json = await res.json();

        const items = (json?.data || []).map((i: { id: number; attributes?: Record<string, unknown>; Title?: string; Slug?: string; Price?: number; DiscountPrice?: number; Discount?: number; IsAvailable?: boolean; product_category?: { data?: { attributes?: { Title?: string } } }; CoverImage?: { data?: { attributes?: { url?: string } } } }) => {
          const attrs = i.attributes ? i.attributes : i;
          return {
            id: i.id,
            slug: (attrs as Record<string, unknown>)?.Slug as string | undefined ?? undefined,
            Title: (attrs as Record<string, unknown>)?.Title as string ?? i.Title ?? '',
            Price: (attrs as Record<string, unknown>)?.Price as number | undefined ?? undefined,
            DiscountPrice: (attrs as Record<string, unknown>)?.DiscountPrice as number | undefined ?? undefined,
            Discount: (attrs as Record<string, unknown>)?.Discount as number | undefined ?? undefined,
            category: ((attrs as Record<string, unknown>)?.product_main_category as { Title?: string } | undefined)?.Title ?? undefined,
            image: ((attrs as Record<string, unknown>)?.CoverImage as { url?: string; formats?: { thumbnail?: { url?: string }; small?: { url?: string } }; data?: { attributes?: { url?: string } } } | undefined)?.formats?.thumbnail?.url
              ? `${IMAGE_BASE_URL}${((attrs as Record<string, unknown>)?.CoverImage as { formats?: { thumbnail?: { url?: string } } })?.formats?.thumbnail?.url}`
              : ((attrs as Record<string, unknown>)?.CoverImage as { url?: string; data?: { attributes?: { url?: string } } } | undefined)?.url
                ? `${IMAGE_BASE_URL}${((attrs as Record<string, unknown>)?.CoverImage as { url?: string })?.url}`
                : ((attrs as Record<string, unknown>)?.CoverImage as { data?: { attributes?: { url?: string } } } | undefined)?.data?.attributes?.url
                  ? `${IMAGE_BASE_URL}${((attrs as Record<string, unknown>)?.CoverImage as { data?: { attributes?: { url?: string } } })?.data?.attributes?.url}`
                : undefined,
            isAvailable: (attrs as Record<string, unknown>)?.IsAvailable as boolean ?? true,
          };
        });
        setSuggestions(items);
      } catch {
        if (!mounted) return;
        setSuggestions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(t);
      controller.abort();
    };
  }, [searchQuery]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1200]">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onPointerDown={markBackdropPointerDown}
        onTouchStart={markBackdropPointerDown}
        onPointerCancel={() => {
          backdropPointerDownRef.current = false;
        }}
        onTouchCancel={() => {
          backdropPointerDownRef.current = false;
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          if (isIOS) return;
          if (ignoreBackdropUntilRef.current > Date.now()) {
            backdropPointerDownRef.current = false;
            return;
          }
          const shouldClose = canClose && backdropPointerDownRef.current;
          backdropPointerDownRef.current = false;
          if (!shouldClose) return;
          closeModal();
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div
            className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-right align-middle shadow-xl transition-all"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg mb-4 font-medium leading-6 text-gray-900">جستجو</h3>

            <div className="mt-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (!isIOS) return;
                    ignoreBackdropUntilRef.current = Date.now() + 700;
                  }}
                  inputMode="search"
                  enterKeyHint="search"
                  className="text-[16px] leading-6 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                  placeholder="دنبال چی میگردی؟"
                  dir="rtl"
                />
                <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.7647 11.7647L14.6667 14.6667"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.33333 12.0833C10.3584 12.0833 11.9999 10.4417 11.9999 8.41667C11.9999 6.39162 10.3584 4.75 8.33333 4.75C6.30828 4.75 4.66666 6.39162 4.66666 8.41667C4.66666 10.4417 6.30828 12.0833 8.33333 12.0833Z"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>
            </div>

            <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white" dir="rtl">
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
              {!loading && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
                <div className="text-xs px-3 py-2 text-gray-500">
                  موردی یافت نشد
                </div>
              )}
              {!loading && suggestions.length > 0 && (
                <>
                  {suggestions.map((s, idx) => (
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
                        closeModal({ force: true });
                        router.push(`/pdp/${s.slug || s.id}`);
                      }}
                      index={idx}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      closeModal({ force: true });
                      trackSearch(searchQuery.trim(), "mobile_view_all");
                      router.push(getSearchHref(searchQuery.trim()));
                    }}
                    className="pressable text-xs block w-full border-t border-white/70 bg-transparent px-3 py-2 text-right text-pink-700 transition-colors hover:bg-white/70"
                  >
                    مشاهده همه نتایج
                  </button>
                </>
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="pressable text-sm inline-flex justify-center rounded-full border border-transparent bg-pink-100 px-4 py-2 font-medium text-pink-900 hover:bg-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                onClick={() => closeModal({ force: true })}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
