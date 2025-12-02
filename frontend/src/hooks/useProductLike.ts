"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import { atom, useAtom } from "jotai";

// Global atom to store liked products
type LikedProduct = {
  createdAt: string;
  id: number;
  product: {
    id: number;
  };
  updatedAt: string;
};

const likedProductsAtom = atom<LikedProduct[]>([]);
const likedProductsLoadingAtom = atom<boolean>(false);
const likedProductsLoadedAtom = atom<boolean>(false);

interface UseProductLikeParams {
  productId: string;
}

let fetchStarted = false;

export function setWindowLocation(url: string) {
  window.location.href = url;
}

export const navigationUtils = {
  setWindowLocation,
};

export const redirectToAuth = () => {
  navigationUtils.setWindowLocation("/auth");
};

const useProductLike = ({ productId }: UseProductLikeParams) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [likedProducts, setLikedProducts] = useAtom(likedProductsAtom);
  const [isGlobalLoading, setIsGlobalLoading] = useAtom(likedProductsLoadingAtom);
  const [hasLoaded, setHasLoaded] = useAtom(likedProductsLoadedAtom);

  // Ensure likedProducts is always an array
  const safeProducts = Array.isArray(likedProducts) ? likedProducts : [];

  // Fetch liked products only once for all instances
  useEffect(() => {
    const fetchLikedProducts = async () => {
      if (fetchStarted) return;

      fetchStarted = true;

      const token = localStorage.getItem("accessToken");
      if (!token || hasLoaded || isGlobalLoading) return;

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
        // Initialize with empty array in case of error
        setLikedProducts([]);
      } finally {
        setIsGlobalLoading(false);
      }
    };

    fetchLikedProducts();
  }, [setLikedProducts, setIsGlobalLoading, setHasLoaded, hasLoaded, isGlobalLoading]);

  // Toggle like status
  const toggleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem("accessToken");
    if (!token) {
      // Redirect to login page if no token
      redirectToAuth();
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post(
        ENDPOINTS.PRODUCT_LIKES.TOGGLE,
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Update the global state
      if (safeProducts.some(({ product }) => product?.id?.toString() === String(productId))) {
        setLikedProducts(
          safeProducts.filter(({ product }) => product?.id?.toString() !== String(productId)),
        );
      } else {
        setLikedProducts([
          ...safeProducts,
          {
            id: Number(productId),
            createdAt: new Date().toISOString(),
            product: { id: Number(productId) },
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error toggling product like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLiked:
      productId && productId !== ""
        ? safeProducts.some(({ product }) => product?.id?.toString() === productId.toString())
        : false,
    isLoading: isLoading || isGlobalLoading,
    toggleLike,
  };
};

export default useProductLike;
export const __resetUseProductLikeState = () => {
  fetchStarted = false;
};
