import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
// removed unused import: useRouter from "next/navigation"
import toast from "react-hot-toast";

interface UseAddToCartProps {
  productId: string;
  name: string;
  category: string;
  price: number;
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
  image,
  color,
  size,
  model,
  variationId,
}: UseAddToCartProps) {
  // removed unused: router
  const {
    addToCart: addToCartContext,
    openDrawer,
    cartItems,
    updateQuantity,
  } = useCart();
  const [quantity, setQuantity] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isManuallyChanged, setIsManuallyChanged] = useState(false);

  // Create a unique ID based on product and variation
  const cartItemId = variationId
    ? `${productId}-${variationId}`
    : `${productId}-${color || ""}-${size || ""}-${model || ""}`;

  // Check if item is in cart and update quantity state if it is
  useEffect(() => {
    const cartItem = cartItems.find((item) => item.id === cartItemId);

    if (cartItem) {
      setIsInCart(true);

      // Always sync quantity with cart
      if (!isManuallyChanged || quantity !== cartItem.quantity) {
        setQuantity(cartItem.quantity);
      }

      // Reset manual change flag after applying
      if (isManuallyChanged) {
        setIsManuallyChanged(false);
      }
    } else {
      setIsInCart(false);
      // Reset quantity to 0 if item is removed from cart elsewhere
      if (!isAdding && quantity > 0) {
        setQuantity(0);
      }
    }
  }, [cartItems, cartItemId, isAdding, isManuallyChanged, quantity]);

  // Custom quantity setter that also updates the cart when the item is already in cart
  const updateItemQuantity = (newQuantity: number) => {
    setIsManuallyChanged(true);
    setQuantity(newQuantity);

    // If the item is already in cart, update its quantity
    if (isInCart && newQuantity > 0) {
      updateQuantity(cartItemId, newQuantity);
    }
  };

  const handleAddToCart = (initialQuantity?: number) => {
    // If an initial quantity is provided, use it (for first-time add)
    // Make sure we're working with a number to avoid object rendering issues
    let actualQuantity: number;

    if (initialQuantity !== undefined) {
      actualQuantity =
        typeof initialQuantity === "number" ? initialQuantity : 1;
    } else {
      actualQuantity = typeof quantity === "number" ? quantity : 1;
    }

    if (isAdding || actualQuantity <= 0) return;

    setIsAdding(true);

    try {
      // Check if user is logged in by looking for accessToken in localStorage
      const accessToken = localStorage.getItem("accessToken"); // removed unused: isLoggedIn

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

      // Check for the specific "Not enough stock" error
      if (error.message && error.message.includes("Not enough stock")) {
        toast.error("موجودی کالا به اندازه تعداد درخواستی شما نیست");
      } else {
        toast.error("افزودن کالا به سبد خرید با خطا مواجه شد");
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
