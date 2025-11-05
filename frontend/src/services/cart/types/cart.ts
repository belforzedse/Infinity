import type { ImageResponse, ProductCategory } from "./media";

export interface CartItemResponse {
  id: number;
  Count: number;
  Sum: string | number;
  createdAt?: string;
  updatedAt?: string;
  product_variation: {
    id: number;
    IsPublished?: boolean;
    SKU?: string;
    Price: number | string;
    createdAt?: string;
    updatedAt?: string;
    product_stock: {
      id?: number;
      Count: number;
      createdAt?: string;
      updatedAt?: string;
    };
    product_variation_color?: {
      id: number;
      Title: string;
      ColorCode?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    product_variation_size?: {
      id: number;
      Title: string;
      createdAt?: string;
      updatedAt?: string;
    };
    product_variation_model?: {
      id: number;
      Title: string;
      createdAt?: string;
      updatedAt?: string;
    };
    product: {
      id?: number;
      Title: string;
      Description?: string;
      Status?: string;
      AverageRating?: number | null;
      RatingCount?: number | null;
      SKU?: string;
      category?: string;
      createdAt?: string;
      updatedAt?: string;
      CleaningTips?: string | null;
      ReturnConditions?: string | null;
      removedAt?: string | null;
      CoverImage?: ImageResponse;
      product_main_category?: ProductCategory;
    };
  };
}

export interface CartResponse {
  id: number;
  Status: string;
  cart_items: CartItemResponse[];
}

export interface CartStockCheckResponse {
  success: boolean;
  valid: boolean;
  cartIsEmpty?: boolean;
  itemsAdjusted?: Array<{
    cartItemId: number;
    productVariationId: number;
    requested: number;
    available: number;
    newQuantity: number;
    message: string;
  }>;
  itemsRemoved?: Array<{
    cartItemId: number;
    productVariationId: number;
    requested: number;
    available: number;
    message: string;
  }>;
  cart?: CartResponse;
  message?: string;
}

export interface AddItemRequest {
  productVariationId: number;
  count: number;
}

export interface UpdateItemRequest {
  cartItemId: number;
  count: number;
}

export interface FinalizeCartRequest {
  shipping: number;
  shippingCost: number;
  description?: string;
  note?: string;
  callbackURL?: string;
  addressId?: number;
  gateway?: "samankish" | "snappay" | "wallet";
  mobile?: string;
  discountCode?: string;
}

export interface FinalizeCartResponse {
  success: boolean;
  message: string;
  orderId: number;
  contractId?: number;
  redirectUrl?: string;
  refId?: string;
  financialSummary?: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  requestId?: string;
}
