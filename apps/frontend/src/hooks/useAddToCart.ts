import { useCart } from "@/contexts/CartContext";
import { useState, useEffect, useRef } from "react";
import notify from "@/utils/notify";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

interface UseAddToCartProps {
  productId: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  image: string;
  color?: string;
  size?: string;
  model?: string;
  variationId?: string;
}

export default function useAddToCart({
  productId,
  name,
  category,
  price,
  originalPrice,
  discountPercentage,
  image,
  color,
  size,
  model,
  variationId,
}: UseAddToCartProps) {
  const { addToCart: addToCartContext, openDrawer, cartItems, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const wasInCartRef = useRef(false);

  // Create a unique ID based on product and variation
  const cartItemId = variationId
    ? `${productId}-${variationId}`
    : `${productId}-${color || ""}-${size || ""}-${model || ""}`;

  useEffect(() => {
    setQuantity(1);
  }, [cartItemId]);

  // Check if item is in cart and update quantity state if it is
  useEffect(() => {
    const cartItem = cartItems.find(
      (item) => item.id === cartItemId || item.cartItemId === cartItemId,
    );

    if (cartItem) {
      setIsInCart(true);
      wasInCartRef.current = true;
      setQuantity(cartItem.quantity);
      return;
    }

    setIsInCart(false);
    setQuantity((currentQuantity) => (wasInCartRef.current ? 1 : Math.max(currentQuantity, 1)));
    wasInCartRef.current = false;
  }, [cartItems, cartItemId]);

  // Custom quantity setter that also updates the cart when the item is already in cart
  const updateItemQuantity = (newQuantity: number) => {
    setQuantity(newQuantity);

    if (isInCart && newQuantity > 0) {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const handleAddToCart = (initialQuantity?: number) => {
    if (isInCart) {
      openDrawer();
      return;
    }

    // If an initial quantity is provided, use it (for first-time add)
    // Make sure we're working with a number to avoid object rendering issues
    let actualQuantity: number;

    if (initialQuantity !== undefined) {
      actualQuantity = typeof initialQuantity === "number" ? initialQuantity : 1;
    } else {
      actualQuantity = typeof quantity === "number" ? quantity : 1;
    }

    if (isAdding || actualQuantity <= 0) return;

    setIsAdding(true);

    try {
      // Check if user is logged in by looking for accessToken in localStorage
      localStorage.getItem("accessToken"); // removed unused: isLoggedIn

      // Add to cart - if logged in, we'll use local storage for now, but this could be extended
      // to use an API endpoint for authenticated users in the future
      addToCartContext({
        id: cartItemId,
        slug: variationId
          ? `${productId}-${variationId}`
          : `${productId}-${color || ""}-${size || ""}-${model || ""}`,
        productId,
        variationId,
        name,
        category,
        price,
        originalPrice,
        discountPercentage,
        quantity: actualQuantity,
        image,
        color,
        size,
        model,
      });

      // Open cart drawer
      openDrawer();
    } catch (error: any) {
      console.error("Error adding to cart:", error);

      const friendlyMessage = getUserFacingErrorMessage(
        error,
        "افزودن کالا به سبد خرید با خطا مواجه شد",
      );
      if (error.message && error.message.includes("Not enough stock")) {
        notify.error("موجودی کالا به اندازه تعداد درخواستی شما نیست");
      } else {
        notify.error(friendlyMessage);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return {
    quantity,
    setQuantity: updateItemQuantity,
    isAdding,
    isInCart,
    cartItemId,
    addToCart: handleAddToCart,
  };
}
