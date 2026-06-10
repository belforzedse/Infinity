"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Modal from "@/components/Kits/Modal";
import { getProductById, type ProductDetail } from "@/services/product/product";
import QuickViewContent from "./QuickViewContent";
import { useRouter } from "next/navigation";

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

/**
 * Module-level cache so reopening the same product within a session is instant.
 * Key: productId  Value: { data, cachedAt }
 * TTL: 60 seconds — avoids showing stale stock/price for the whole session.
 */
const CACHE_TTL_MS = 60_000;
const productCache = new Map<number, { data: ProductDetail; cachedAt: number }>();

/** Exposed so Card.tsx (and others) can warm the cache on hover before the click. */
export function preloadQuickViewProduct(productId: number): void {
  const cached = productCache.get(productId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return;

  // Fire-and-forget — ignore errors here, the modal handles them on open
  void getProductById(productId.toString()).then((response) => {
    if (response?.data) {
      productCache.set(productId, { data: response.data, cachedAt: Date.now() });
    }
  });
}

/** @internal — only for unit tests; not part of the public API. */
export function _clearQuickViewCacheForTesting(): void {
  productCache.clear();
}

export default function QuickViewModal({ isOpen, onClose, productId }: QuickViewModalProps) {
  const [productData, setProductData] = useState<ProductDetail | null>(null);
  // Start as `true` so the skeleton renders on the very first frame, before any effect fires.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  // Guard setState calls after unmount to prevent memory-leak warnings.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchProduct = useCallback(async () => {
    // Cancel any in-flight request from a previous open/product.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // --- Cache hit: serve immediately, no skeleton needed ---
    const cached = productCache.get(productId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      if (mountedRef.current) {
        setProductData(cached.data);
        setError(null);
        setIsLoading(false);
      }
      return;
    }

    // --- Cache miss: show skeleton, then fetch ---
    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await getProductById(productId.toString());
      if (!mountedRef.current) return;

      if (response?.data) {
        productCache.set(productId, { data: response.data, cachedAt: Date.now() });
        setProductData(response.data);
      } else {
        setError("محصول یافت نشد");
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        console.error("Error fetching product for quick view:", err);
        setError("خطا در بارگیری اطلاعات محصول");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [productId]);

  // Fetch when modal opens; cancel in-flight request on close or productId change.
  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen, productId, fetchProduct]);

  // Reset state when modal closes so the next open starts clean.
  // isLoading is reset to `true` so the skeleton shows immediately on the next open
  // instead of flashing a blank frame while the effect fires.
  useEffect(() => {
    if (!isOpen) {
      setProductData(null);
      setError(null);
      setIsLoading(true);
    }
  }, [isOpen]);

  const viewFullDetails = useCallback(() => {
    if (productData) {
      const slug = productData.attributes.Slug || productId.toString();
      router.push(`/pdp/${slug}`);
      onClose();
    }
  }, [productData, productId, router, onClose]);

  const handleRetry = useCallback(() => {
    // Evict the cache entry so a real fetch happens on retry.
    productCache.delete(productId);
    fetchProduct();
  }, [productId, fetchProduct]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      // flex-col + max-h-[90dvh]: header is fixed, content area scrolls — no viewport overflow.
      // max-w-3xl keeps the modal compact without sacrificing the two-column layout.
      className="flex max-h-[90dvh] max-w-3xl flex-col overflow-hidden"
      // flex-1 min-h-0: content fills the space left by the header and scrolls when needed.
      contentClassName="custom-scrollbar flex-1 overflow-y-auto p-0"
      aria-labelledby="quick-view-title"
    >
      {isLoading ? (
        <QuickViewSkeleton />
      ) : error ? (
        <QuickViewError message={error} onRetry={handleRetry} onClose={onClose} />
      ) : productData ? (
        <QuickViewContent
          productData={productData}
          productId={productId}
          onViewFullDetails={viewFullDetails}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------
function QuickViewSkeleton() {
  return (
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
      {/* Image skeleton */}
      <div className="space-y-3">
        <div className="skeleton-shimmer aspect-square rounded-2xl" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-shimmer-light h-14 w-14 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Info skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="skeleton-shimmer-light h-5 w-1/3 rounded" />
          <div className="skeleton-shimmer h-6 w-2/3 rounded" />
        </div>
        <div className="skeleton-shimmer-light h-14 rounded-2xl" />
        <div className="skeleton-shimmer-light h-10 rounded-2xl" />
        <div className="skeleton-shimmer h-11 rounded-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------
interface QuickViewErrorProps {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}

function QuickViewError({ message, onRetry, onClose }: QuickViewErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 text-6xl" aria-hidden="true">😔</div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">مشکلی پیش آمد</h3>
      <p className="mb-6 text-gray-600">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-infinity-primary px-6 py-3 text-white transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2"
        >
          تلاش مجدد
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-gray-200 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          بستن
        </button>
      </div>
    </div>
  );
}
