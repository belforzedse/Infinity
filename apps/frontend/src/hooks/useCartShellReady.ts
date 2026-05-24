"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";

/**
 * True only after the page has mounted and cart context finished its first client init.
 * Use before branching cart layout (empty vs skeleton vs items) to match SSR HTML on hydration
 * and on client navigations when CartProvider state may already be populated.
 */
export function useCartShellReady() {
  const { isCartReady } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isCartReady && isMounted;
}
