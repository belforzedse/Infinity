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

// Types for API responses
export interface ImageFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
  sizeInBytes?: number;
}

export interface ImageFormats {
  large?: ImageFormat;
  small?: ImageFormat;
  medium?: ImageFormat;
  thumbnail?: ImageFormat;
}

export interface ImageResponse {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: ImageFormats;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any | null;
  folderPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: number;
  Title: string;
  Slug: string;
  createdAt: string;
  updatedAt: string;
}

// Re-export the interface that's already defined in types/cart
export type { CartItemResponse, CartResponse, CartStockCheckResponse };

export interface AddItemRequest {
  productVariationId: number;
  count: number;
}

export interface UpdateItemRequest {
  cartItemId: number;
  count: number;
}

// Re-export the interface that's already defined in types/cart
export type { FinalizeCartRequest, FinalizeCartResponse };

// Export all the imported functions
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

// Export all functions as a service object
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
