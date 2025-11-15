"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CartService } from "@/services";
import { IMAGE_BASE_URL } from "@/constants/api";
import notify from "@/utils/notify";
import { cartRequestQueue } from "@/utils/requestQueue";

export interface CartItem {
  id: string;
  cartItemId?: string;
  slug: string;
  productId: string;
  variationId?: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  quantity: number;
  image: string;
  color?: string;
  size?: string;
  model?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  subtotalBeforeDiscount: number;
  cartDiscountTotal: number;
  isLoading: boolean;
  checkCartStock: () => Promise<boolean>;
  migrateLocalCartToApi: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  // Read login state on client after hydration to avoid SSR mismatch
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateLoginState = () => {
      setIsLoggedIn(!!localStorage.getItem("accessToken"));
    };

    updateLoginState();
    window.addEventListener("storage", updateLoginState);

    return () => {
      window.removeEventListener("storage", updateLoginState);
    };
  }, []);

  // Close drawer when path changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Initialize cart based on authentication status
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserCart();
    } else {
      // Load cart from localStorage for non-logged in users
      const storedCart = localStorage.getItem("cart");
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (error) {
          console.error("Error parsing stored cart:", error);
          localStorage.removeItem("cart");
        }
      }
    }
  }, [isLoggedIn]);

  // Save cart to localStorage when it changes (only for non-logged in users)
  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isLoggedIn]);

  // Fetch user's cart from API
  const fetchUserCart = async () => {
    try {
      setIsLoading(true);

      const data = await CartService.getUserCart();

      // Helper function to get image URL from CoverImage object
      const getImageUrl = (coverImage: any): string => {
        if (!coverImage) return "";

        // If medium format is available, use it, otherwise use the original
        const imageUrl = coverImage.formats?.medium?.url || coverImage.url;

        // Make sure the URL starts with the IMAGE_BASE_URL
        if (imageUrl.startsWith("http")) {
          return imageUrl; // Already a full URL
        } else {
          return `${IMAGE_BASE_URL}${imageUrl}`; // Add base URL
        }
      };

      const parseNumericValue = (value: unknown): number | undefined => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === "number") {
          return Number.isFinite(value) ? value : undefined;
        }
        if (typeof value === "string") {
          const cleaned = value.replace(/,/g, "").trim();
          if (!cleaned) return undefined;
          const parsed = parseFloat(cleaned);
          return Number.isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
      };

      const extractGeneralDiscountPercent = (variation: any): number | undefined => {
        if (!variation) return undefined;

        const candidateGroups = [variation.general_discounts, variation.general_discount];

        for (const group of candidateGroups) {
          if (!group) continue;

          const nodes = Array.isArray(group)
            ? group
            : Array.isArray(group?.data)
              ? group.data
              : group?.data
                ? [group.data]
                : [group];

          for (const node of nodes) {
            const amount =
              node?.attributes?.Amount ?? node?.Amount ?? node?.attributes?.amount ?? node?.amount;
            const parsedAmount = parseNumericValue(amount);
            if (parsedAmount !== undefined) return parsedAmount;
          }
        }

        return undefined;
      };

      // Transform API cart format to local format
      const originalItemCount = data?.cart_items?.length || 0;
      const transformedItems: CartItem[] = data?.cart_items?.map((item) => {
        const variation = item.product_variation;
        const product = variation?.product;

        // Skip items without product or variation
        if (!product || !variation) {
          console.warn("Skipping cart item with missing product/variation data:", {
            itemId: item.id,
            hasVariation: !!variation,
            hasProduct: !!product,
          });
          return null;
        }

        const productId = String(product.id || "");
        const compositeId = variation.id
          ? `${productId}-${variation.id}`
          : String(item.id);

        // Get image URL from CoverImage
        const imageUrl = getImageUrl(product.CoverImage);

        // Get category from product_main_category or fallback
        const category = product.product_main_category?.Title || "Unknown";

        // Parse price to ensure it's a number
        const basePrice = parseNumericValue(variation.Price) ?? 0;
        const listedDiscountPrice = parseNumericValue((variation as any)?.DiscountPrice);
        const generalDiscountPercent = extractGeneralDiscountPercent(variation);

        let finalUnitPrice = basePrice;
        if (
          listedDiscountPrice &&
          listedDiscountPrice > 0 &&
          (finalUnitPrice === 0 || listedDiscountPrice < finalUnitPrice)
        ) {
          finalUnitPrice = listedDiscountPrice;
        }

        if (
          generalDiscountPercent &&
          generalDiscountPercent > 0 &&
          generalDiscountPercent < 100 &&
          basePrice > 0
        ) {
          const computed = Math.round(basePrice * (1 - generalDiscountPercent / 100));
          if (computed > 0 && (finalUnitPrice === 0 || computed < finalUnitPrice)) {
            finalUnitPrice = computed;
          }
        }

        const lineSum = parseNumericValue(item.Sum);
        if (lineSum && item.Count && item.Count > 0) {
          const derivedUnitPrice = lineSum / item.Count;
          if (
            Number.isFinite(derivedUnitPrice) &&
            derivedUnitPrice > 0 &&
            (finalUnitPrice === 0 || derivedUnitPrice < finalUnitPrice)
          ) {
            finalUnitPrice = derivedUnitPrice;
          }
        }

        if (finalUnitPrice === 0 && listedDiscountPrice) {
          finalUnitPrice = listedDiscountPrice;
        }
        if (finalUnitPrice === 0 && basePrice > 0) {
          finalUnitPrice = basePrice;
        }

        const hasDiscount = basePrice > 0 && finalUnitPrice > 0 && finalUnitPrice < basePrice;
        const originalPrice = hasDiscount ? basePrice : undefined;
        const discountPercentage = hasDiscount
          ? Math.round(((basePrice - finalUnitPrice) / basePrice) * 100)
          : undefined;

        return {
          id: compositeId,
          cartItemId: String(item.id),
          slug: `${variation.SKU || product.id}-${variation.id}`,
          productId,
          variationId: String(variation.id),
          name: product.Title,
          category: category,
          price: finalUnitPrice,
          originalPrice,
          discountPercentage,
          quantity: item.Count,
          image: imageUrl,
          color: variation.product_variation_color?.Title,
          size: variation.product_variation_size?.Title,
          model: variation.product_variation_model?.Title,
        };
      }).filter((item) => item !== null);

      // Notify user if items were removed due to missing data
      if (transformedItems.length < originalItemCount && typeof window !== "undefined") {
        const removedCount = originalItemCount - transformedItems.length;
        console.warn(
          `${removedCount} item(s) were removed from cart due to missing product data. They may have been deleted.`
        );
      }

      setCartItems(transformedItems);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to migrate local cart to API when user logs in
  const migrateLocalCartToApi = async () => {
    // Get cart from localStorage
    const storedCart = localStorage.getItem("cart");
    if (!storedCart) return;

    try {
      setIsLoading(true);
      const localCartItems: CartItem[] = JSON.parse(storedCart);

      // If there are items in the local cart
      if (localCartItems.length > 0) {
        // Add each item to the API cart
        for (const item of localCartItems) {
          if (item.variationId) {
            await CartService.addItemToCart(Number(item.variationId), item.quantity);
          }
        }

        // Clear the local cart after migration
        localStorage.removeItem("cart");

        // Fetch updated cart from API
        await fetchUserCart();
      }
    } catch (error) {
      console.error("Failed to migrate cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const addToCart = async (newItem: CartItem) => {
    if (isLoggedIn) {
      // Optimistic update: add item to cart immediately
      const previousCartItems = cartItems;
      let itemWasAdded = false;

      setCartItems((prev) => {
        const existingItemIndex = prev.findIndex((item) => item.slug === newItem.slug);

        if (existingItemIndex !== -1) {
          // Update quantity if item exists
          const updatedItems = [...prev];
          const existingItem = updatedItems[existingItemIndex];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + newItem.quantity,
            price: newItem.price,
            originalPrice: newItem.originalPrice ?? existingItem.originalPrice,
            discountPercentage: newItem.discountPercentage ?? existingItem.discountPercentage,
          };
          itemWasAdded = true;
          return updatedItems;
        } else {
          // Add new item
          itemWasAdded = true;
          return [...prev, newItem];
        }
      });

      // Queue API call in the background
      try {
        setIsLoading(true);
        await cartRequestQueue.enqueue(
          async () => {
            await CartService.addItemToCart(Number(newItem.variationId), newItem.quantity);
            // Refresh cart to ensure consistency with backend
            await fetchUserCart();
          },
          `add-${newItem.slug}`
        );
      } catch (error: any) {
        console.error("Failed to add item to cart:", error);

        // Revert optimistic update on failure
        setCartItems(previousCartItems);

        // Check for the specific "Not enough stock" error
        if (error.message && error.message.includes("Not enough stock")) {
          notify.error("موجودی کالا به اندازه تعداد درخواستی شما نیست");
        } else {
          notify.error("افزودن کالا به سبد خرید با خطا مواجه شد");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage implementation (no queue needed for guest users)
      setCartItems((prev) => {
        // Check if item already exists in cart
        const existingItemIndex = prev.findIndex((item) => item.slug === newItem.slug);

        if (existingItemIndex !== -1) {
          // Update quantity if item exists
          const updatedItems = [...prev];
          const existingItem = updatedItems[existingItemIndex];
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + newItem.quantity,
            price: newItem.price,
            originalPrice: newItem.originalPrice ?? existingItem.originalPrice,
            discountPercentage: newItem.discountPercentage ?? existingItem.discountPercentage,
          };
          return updatedItems;
        } else {
          // Add new item
          return [...prev, newItem];
        }
      });
    }
  };

  const removeFromCart = async (id: string) => {
    if (isLoggedIn) {
      // Optimistic update: remove item from cart immediately
      const previousCartItems = cartItems;

      // Find cart item ID from our local state that matches the item ID
      const item = cartItems.find((item) => item.id === id || item.cartItemId === id);
      if (!item) return;

      // Remove item optimistically
      setCartItems((prev) => prev.filter((item) => item.id !== id && item.cartItemId !== id));

      // Queue API call in the background
      try {
        setIsLoading(true);

        // Extract the cart item ID from the API (assuming it's in the variationId field)
        const cartItemId = item.cartItemId || item.id;
        if (!cartItemId) {
          throw new Error("Cart item ID not found");
        }

        await cartRequestQueue.enqueue(
          async () => {
            await CartService.removeCartItem(Number(cartItemId));
            // Refresh cart to ensure consistency with backend
            await fetchUserCart();
          },
          `remove-${cartItemId}`
        );
      } catch (error) {
        console.error("Failed to remove item from cart:", error);

        // Revert optimistic update on failure
        setCartItems(previousCartItems);
        notify.error("حذف کالا از سبد خرید با خطا مواجه شد");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage implementation (no queue needed for guest users)
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    if (isLoggedIn) {
      // Optimistic update: update quantity immediately
      const previousCartItems = cartItems;

      // Find cart item ID from our local state that matches the item ID
      const item = cartItems.find((item) => item.id === id || item.cartItemId === id);
      if (!item) return;

      // Update quantity optimistically
      setCartItems((prev) =>
        prev.map((cartItem) =>
          cartItem.id === id || cartItem.cartItemId === id
            ? { ...cartItem, quantity }
            : cartItem
        )
      );

      // Queue API call in the background
      try {
        setIsLoading(true);

        // Extract the cart item ID from the API
        const cartItemId = item.cartItemId || item.id;
        if (!cartItemId) {
          throw new Error("Cart item ID not found");
        }

        await cartRequestQueue.enqueue(
          async () => {
            await CartService.updateCartItem(Number(cartItemId), quantity);
            // Refresh cart to ensure consistency with backend
            await fetchUserCart();
          },
          `update-${cartItemId}`
        );
      } catch (error: any) {
        console.error("Failed to update cart item:", error);

        // Revert optimistic update on failure
        setCartItems(previousCartItems);

        // Check for the specific "Not enough stock" error
        if (error.message && error.message.includes("Not enough stock")) {
          notify.error("موجودی کالا به اندازه تعداد درخواستی شما نیست");
        } else {
          notify.error("بروزرسانی سبد خرید با خطا مواجه شد");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage implementation (no queue needed for guest users)
      setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
    }
  };

  const clearCart = async () => {
    if (isLoggedIn) {
      // For API users, just refresh their cart
      await fetchUserCart();
    } else {
      // For local storage users, clear the cart
      setCartItems([]);
      localStorage.removeItem("cart");
    }
  };

  // Check if all items in cart have sufficient stock
  const checkCartStock = async (): Promise<boolean> => {
    if (isLoggedIn) {
      try {
        setIsLoading(true);

        const data = await CartService.checkCartStock();

        // If cart was modified (items adjusted or removed), refresh the local cart
        if (!data.valid) {
          await fetchUserCart();
        }

        return data.valid;
      } catch (error) {
        console.error("Failed to check cart stock:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    } else {
      // For non-logged in users, we can't check stock, so assume it's valid
      // In a real app, you might want to implement a similar check for guest users
      return true;
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const subtotalBeforeDiscount = cartItems.reduce((sum, item) => {
    const unit = item.originalPrice && item.originalPrice > 0 ? item.originalPrice : item.price;
    return sum + unit * item.quantity;
  }, 0);

  const cartDiscountTotal =
    subtotalBeforeDiscount > totalPrice ? subtotalBeforeDiscount - totalPrice : 0;

  const value = {
    cartItems,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    subtotalBeforeDiscount,
    cartDiscountTotal,
    isLoading,
    checkCartStock,
    migrateLocalCartToApi,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
