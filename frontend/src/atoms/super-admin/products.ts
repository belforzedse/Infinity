import { categoryResponseType } from "@/services/super-admin/product/category/getAll";
import { PaginatedResponse } from "@/types/api";
import { EditProductData, ProductData } from "@/types/super-admin/products";
import { atom } from "jotai";

export const productDataAtom = atom<ProductData>({
  Title: "",
  CoverImage: null,
  Description: "",
  Status: "Active",
  Media: [],
  product_main_category: null,
  product_tags: [],
  Files: [],
  product_other_categories: [],
});

export const editProductDataAtom = atom<EditProductData>({
  Title: "",
  CoverImage: null,
  Description: "",
  Status: "Active",
  Media: [],
  product_main_category: null,
  product_tags: [],
  Files: [],
  product_other_categories: [],
});

export const productCategoryDataAtom = atom<categoryResponseType[]>([]);
export const productCategoryDataAtomPagination = atom<
  PaginatedResponse<categoryResponseType>["meta"]
>({
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  itemsPerPage: 0,
});
