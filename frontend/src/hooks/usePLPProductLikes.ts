"use client";

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useAtom } from "jotai";
import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import {
  likedProductsAtom,
  likedProductsLoadedAtom,
  likedProductsLoadingAtom,
  redirectToAuth,
  type LikedProduct,
} from "./useProductLike";

interface UsePLPProductLikesResult {
  isProductLiked: (productId: number | string) => boolean;
  isProductLikeLoading: (productId: number | string) => boolean;
  toggleProductLike: (
    productId: number | string,
    e: MouseEvent<HTMLButtonElement>,
  ) => Promise<void>;
}

const normalizeProductId = (productId: number | string): string => String(productId);

const toLikedProduct = (productId: number | string): LikedProduct => {
  const id = Number(productId);
  const now = new Date().toISOString();

  return {
    id,
    createdAt: now,
    updatedAt: now,
    product: { id },
  };
};

export default function usePLPProductLikes(productIds: Array<number | string>): UsePLPProductLikesResult {
  const [likedProducts, setLikedProducts] = useAtom(likedProductsAtom);
  const [hasLoaded, setHasLoaded] = useAtom(likedProductsLoadedAtom);
  const [isGlobalLoading, setIsGlobalLoading] = useAtom(likedProductsLoadingAtom);
  const [pendingProductIds, setPendingProductIds] = useState<Set<string>>(new Set());

  const safeProducts = useMemo(
    () => (Array.isArray(likedProducts) ? likedProducts : []),
    [likedProducts],
  );

  const productIdSet = useMemo(() => {
    const values = productIds.map((id) => normalizeProductId(id)).filter(Boolean);
    return new Set(values);
  }, [productIds]);

  const likedIdSet = useMemo(() => {
    const ids = safeProducts
      .map((item) => item?.product?.id)
      .filter((id): id is number => Number.isInteger(id))
      .map((id) => String(id));
    return new Set(ids);
  }, [safeProducts]);

  useEffect(() => {
    if (productIdSet.size === 0) return;
    if (hasLoaded || isGlobalLoading) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const fetchLikedProducts = async () => {
      try {
        setIsGlobalLoading(true);
        const response = await apiClient.get<{ data: LikedProduct[] }>(
          ENDPOINTS.PRODUCT_LIKES.USER_LIKES,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const productsData = Array.isArray(response.data) ? response.data : [];
        setLikedProducts(productsData);
        setHasLoaded(true);
      } catch (error) {
        console.error("Error fetching liked products:", error);
        setLikedProducts([]);
      } finally {
        setIsGlobalLoading(false);
      }
    };

    void fetchLikedProducts();
  }, [
    hasLoaded,
    isGlobalLoading,
    productIdSet,
    setHasLoaded,
    setIsGlobalLoading,
    setLikedProducts,
  ]);

  const isProductLiked = useCallback(
    (productId: number | string) => likedIdSet.has(normalizeProductId(productId)),
    [likedIdSet],
  );

  const isProductLikeLoading = useCallback(
    (productId: number | string) =>
      isGlobalLoading || pendingProductIds.has(normalizeProductId(productId)),
    [isGlobalLoading, pendingProductIds],
  );

  const toggleProductLike = useCallback(
    async (productId: number | string, e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const normalizedId = normalizeProductId(productId);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        redirectToAuth();
        return;
      }

      try {
        setPendingProductIds((previous) => {
          const next = new Set(previous);
          next.add(normalizedId);
          return next;
        });

        await apiClient.post(
          ENDPOINTS.PRODUCT_LIKES.TOGGLE,
          { productId: normalizedId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setLikedProducts((previous) => {
          const current = Array.isArray(previous) ? previous : [];
          const alreadyLiked = current.some(
            (item) => normalizeProductId(item?.product?.id ?? "") === normalizedId,
          );

          if (alreadyLiked) {
            return current.filter(
              (item) => normalizeProductId(item?.product?.id ?? "") !== normalizedId,
            );
          }

          return [...current, toLikedProduct(normalizedId)];
        });
      } catch (error) {
        console.error("Error toggling product like:", error);
      } finally {
        setPendingProductIds((previous) => {
          const next = new Set(previous);
          next.delete(normalizedId);
          return next;
        });
      }
    },
    [setLikedProducts],
  );

  return {
    isProductLiked,
    isProductLikeLoading,
    toggleProductLike,
  };
}
