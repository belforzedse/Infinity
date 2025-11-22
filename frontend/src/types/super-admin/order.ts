import type { ProductCoverImage } from "@/types/Product";

export interface SuperAdminOrderItem {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
  coverImage?: ProductCoverImage;
}

export interface SuperAdminOrderDetail {
  id: number;
  orderDate: Date;
  orderStatus: string;
  userId: string;
  userName: string;
  description: string;
  phoneNumber: string;
  address?: string;
  postalCode?: string;
  paymentGateway?: string;
  transactionId?: string;
  paymentToken?: string;
  createdAt: Date;
  updatedAt: Date;
  contractStatus:
    | "Not Ready"
    | "Confirmed"
    | "Finished"
    | "Failed"
    | "Cancelled";
  items: SuperAdminOrderItem[];
  shipping: number;
  shippingMethod?: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  shippingBarcode?: string;
  shippingPostPrice?: number;
  shippingTax?: number;
  shippingWeight?: number;
  shippingBoxSizeId?: number;
}

