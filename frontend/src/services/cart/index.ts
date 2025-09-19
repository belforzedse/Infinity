import { getUserCart } from "./base";
import {
  addItemToCart,
  updateCartItem,
  removeCartItem,
  finalizeCart,
} from "./mutations";
import {
  checkCartStock,
  getSnappEligible,
  getShippingPreview,
} from "./queries";
import { applyDiscount } from "./discount";
import type {
  CartResponse,
  CartItemResponse,
  CartStockCheckResponse,
  FinalizeCartRequest,
  FinalizeCartResponse,
} from "./types/cart";
import { apiClient } from "../index";

export type {
  CartResponse,
  CartItemResponse,
  CartStockCheckResponse,
  FinalizeCartRequest,
  FinalizeCartResponse,
};

export {
  getUserCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  checkCartStock,
  finalizeCart,
  getSnappEligible,
  getShippingPreview,
  applyDiscount,
};

const CartService = {
  getUserCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  checkCartStock,
  finalizeCart,
  getSnappEligible,
  getShippingPreview,
  applyDiscount,
};

export default CartService;
