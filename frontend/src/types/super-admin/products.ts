import { categoryResponseType } from "@/services/super-admin/product/cetegory/getAll";
import {
  CoverImageField,
  MediaDataItem,
} from "@/services/super-admin/product/get";
import { TagResponseType } from "@/services/super-admin/product/tag/get";

export interface ProductData {
  Title: string;
  CoverImage: CoverImageField | null;
  Description: string;
  Status: "Active";
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
  Media: MediaDataItem[];
  product_main_category: categoryResponseType | null;
  product_tags: TagResponseType[];
  Files: MediaDataItem[];
  product_other_categories: categoryResponseType[];
}
