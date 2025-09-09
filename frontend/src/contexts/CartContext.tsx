"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CartService } from "@/services";
import { IMAGE_BASE_URL } from "@/constants/api";
import toast from "react-hot-toast";

// API base URL
// const API_BASE_URL = "https://api.infinity.rgbgroup.ir/api";

export interface CartItem {
  id: string;
  slug: string;
  productId: string;
  variationId?: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
  size?: string;
  model?: string;
}

// New interfaces for API responses
interface ApiCartItem {
  id: number;
  Count: number;
  Sum: number;
  product_variation: {
    id: number;
    Price: number;
    product_stock: {
      Count: number;
    };
    product_variation_color?: {
      id: number;
      Title: string;
    };
    product_variation_size?: {
      id: number;
      Title: string;
    };
    product_variation_model?: {
      id: number;
      Title: string;
    };
    product: {
      Title: string;
      SKU: string;
      // Add any other needed product properties
      category?: string;
      image?: string;
    };
  };
}

interface ApiCart {
  id: number;
  Status: string;
  cart_items: ApiCartItem[];
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
  const pathname = usePathname();

  // Check if user is logged in
  const isLoggedIn =
    typeof window !== "undefined"
      ? !!localStorage.getItem("accessToken")
      : false;

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

      // Transform API cart format to local format
      const transformedItems: CartItem[] = data?.cart_items?.map((item) => {
        const variation = item.product_variation;
        const product = variation.product;

        // Get image URL from CoverImage
        const imageUrl = getImageUrl(product.CoverImage);

        // Get category from product_main_category or fallback
        const category = product.product_main_category?.Title || "Unknown";

        // Parse price to ensure it's a number
        const price =
          typeof variation.Price === "string"
            ? parseFloat(variation.Price)
            : variation.Price;

        return {
          id: String(item.id),
          slug: `${variation.SKU || product.id}-${variation.id}`,
          productId: String(product.id || ""),
          variationId: String(variation.id),
          name: product.Title,
          category: category,
          price: price,
          quantity: item.Count,
          image: imageUrl,
          color: variation.product_variation_color?.Title,
          size: variation.product_variation_size?.Title,
          model: variation.product_variation_model?.Title,
        };
      });

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
            await CartService.addItemToCart(
              Number(item.variationId),
              item.quantity,
            );
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
      // Add to cart via API
      try {
        setIsLoading(true);

        await CartService.addItemToCart(
          Number(newItem.variationId),
          newItem.quantity,
        );

        // Refresh cart after adding item
        await fetchUserCart();
      } catch (error: any) {
        console.error("Failed to add item to cart:", error);

        // Check for the specific "Not enough stock" error
        if (error.message && error.message.includes("Not enough stock")) {
          toast.error("موجودی کالا به اندازه تعداد درخواستی شما نیست");
        } else {
          toast.error("افزودن کالا به سبد خرید با خطا مواجه شد");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage implementation
      setCartItems((prev) => {
        // Check if item already exists in cart
        const existingItemIndex = prev.findIndex(
          (item) => item.slug === newItem.slug,
        );

        if (existingItemIndex !== -1) {
          // Update quantity if item exists
          const updatedItems = [...prev];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
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
      try {
        setIsLoading(true);

        // Find cart item ID from our local state that matches the item ID
        const item = cartItems.find((item) => item.id === id);
        if (!item) return;

        // Extract the cart item ID from the API (assuming it's in the variationId field)
        const cartItemId = item.id;
        if (!cartItemId) return;

        await CartService.removeCartItem(Number(cartItemId));

        // Refresh cart after removing item
        await fetchUserCart();
      } catch (error) {
        console.error("Failed to remove item from cart:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage implementation
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    if (isLoggedIn) {
      try {
        setIsLoading(true);

        // Find cart item ID from our local state that matches the item ID
        const item = cartItems.find((item) => item.id === id);
        if (!item) return;

        // Extract the cart item ID from the API
        const cartItemId = item.id;
        if (!cartItemId) return;

        await CartService.updateCartItem(Number(cartItemId), quantity);

        // Refresh cart after updating item
        await fetchUserCart();
      } catch (error: any) {
        console.error("Failed to update cart item:", error);

        // Check for the specific "Not enough stock" error
        if (error.message && error.message.includes("Not enough stock")) {
          toast.error("موجودی کالا به اندازه تعداد درخواستی شما نیست");
        } else {
          toast.error("بروزرسانی سبد خرید با خطا مواجه شد");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local storage implementation
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
      );
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

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

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
    isLoading,
    checkCartStock,
    migrateLocalCartToApi,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
