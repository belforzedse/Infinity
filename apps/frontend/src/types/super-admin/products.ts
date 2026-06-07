import type { categoryResponseType } from "@/services/super-admin/product/category/getAll";
import type { CoverImageField, MediaDataItem } from "@/services/super-admin/product/get";
import type { TagResponseType } from "@/services/super-admin/product/tag/get";

export interface ProductData {
  Title: string;
  CoverImage: CoverImageField | null;
  Description: string;
  Status: "Active";
  ProductType: "Variable" | "Simple";
  IsSimpleProduct: boolean;
  SimpleSKU?: string;
  SimplePrice?: number;
  SimpleDiscountPrice?: number | null;
  SimpleStock?: number;
  SimpleIsPublished?: boolean;
  Weight?: number;
  Media: string[];
  product_main_category: categoryResponseType | null;
  product_tags: TagResponseType[];
  Files: string[];
  product_other_categories: categoryResponseType[];
}
export interface EditProductData {
  Title: string;
  CoverImage: CoverImageField | null;
  Description: string;
  Status: "Active";
  ProductType: "Variable" | "Simple";
  IsSimpleProduct: boolean;
  SimpleVariationId?: number;
  SimpleStockId?: number;
  SimpleSKU?: string;
  SimplePrice?: number;
  SimpleDiscountPrice?: number | null;
  SimpleStock?: number;
  SimpleIsPublished?: boolean;
  Weight?: number;
  Media: MediaDataItem[];
  product_main_category: categoryResponseType | null;
  product_tags: TagResponseType[];
  Files: MediaDataItem[];
  product_other_categories: categoryResponseType[];
}
