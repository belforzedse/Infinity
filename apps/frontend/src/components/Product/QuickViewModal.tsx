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

export default function QuickViewModal({ isOpen, onClose, productId }: QuickViewModalProps) {
  const [productData, setProductData] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProduct = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await getProductById(productId.toString());

      if (response?.data) {
        setProductData(response.data);
      } else {
        setError("محصول یافت نشد");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error fetching product for quick view:", err);
        setError("خطا در بارگیری اطلاعات محصول");
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct();
    }

    // Cleanup on unmount or when modal closes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, productId, fetchProduct]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProductData(null);
      setError(null);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      // Ctrl/Cmd + Enter to view full details
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && productData) {
        viewFullDetails();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, productData]);

  const viewFullDetails = useCallback(() => {
    if (productData) {
      const slug = productData.attributes.Slug || productId.toString();
      router.push(`/pdp/${slug}`);
      onClose();
    }
  }, [productData, productId, router, onClose]);

  const handleRetry = useCallback(() => {
    fetchProduct();
  }, [fetchProduct]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-6xl overflow-hidden !p-0"
      aria-labelledby="quick-view-title"
    >
      <div className="custom-scrollbar relative max-h-[90vh] overflow-y-auto">
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
      </div>
    </Modal>
  );
}

// Loading Skeleton Component
function QuickViewSkeleton() {
  return (
    <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-10">
      {/* Image Skeleton */}
      <div className="space-y-4">
        <div className="skeleton-shimmer aspect-square rounded-lg" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-shimmer-light h-20 w-20 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="skeleton-shimmer-light h-6 w-1/3 rounded" />
          <div className="skeleton-shimmer h-8 w-2/3 rounded" />
        </div>

        <div className="space-y-2">
          <div className="skeleton-shimmer-light h-4 w-full rounded" />
          <div className="skeleton-shimmer-light h-4 w-5/6 rounded" />
          <div className="skeleton-shimmer-light h-4 w-4/6 rounded" />
        </div>

        <div className="skeleton-shimmer-light h-16 rounded" />
        <div className="skeleton-shimmer-light h-12 rounded" />
        <div className="skeleton-shimmer h-12 rounded-full" />
      </div>
    </div>
  );
}

// Error Component
interface QuickViewErrorProps {
  message: string;
  onRetry: () => void;
  onClose: () => void;
}

function QuickViewError({ message, onRetry, onClose }: QuickViewErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 text-6xl">😔</div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">مشکلی پیش آمد</h3>
      <p className="mb-6 text-gray-600">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-infinity-primary px-6 py-3 text-white transition-colors hover:bg-infinity-primary"
        >
          تلاش مجدد
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-gray-200 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-300"
        >
          بستن
        </button>
      </div>
    </div>
  );
}
