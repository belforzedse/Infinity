import { getUserCart } from "./base";
import {
  addItemToCart,
  updateCartItem,
  removeCartItem,
  finalizeCart,
} from "./mutations";
import { checkCartStock, getSnappEligible } from "./queries";
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
  applyDiscount,
};

export default CartService;
