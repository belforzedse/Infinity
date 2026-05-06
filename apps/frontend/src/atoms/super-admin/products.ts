import type { categoryResponseType } from "@/services/super-admin/product/category/getAll";
import type { PaginatedResponse } from "@/types/api";
import type { EditProductData, ProductData } from "@/types/super-admin/products";
import { atom } from "jotai";

const createEmptyProductData = (): ProductData => ({
  Title: "",
  CoverImage: null,
  Description: "",
  Status: "Active",
  Weight: 100,
  Media: [],
  product_main_category: null,
  product_tags: [],
  Files: [],
  product_other_categories: [],
});

const createEmptyEditProductData = (): EditProductData => ({
  Title: "",
  CoverImage: null,
  Description: "",
  Status: "Active",
  Weight: 100,
  Media: [],
  product_main_category: null,
  product_tags: [],
  Files: [],
  product_other_categories: [],
});

export const productDataAtom = atom<ProductData>(createEmptyProductData());

export const editProductDataAtom = atom<EditProductData>(createEmptyEditProductData());

export const resetProductDataAtom = atom(null, (_get, set) => {
  set(productDataAtom, createEmptyProductData());
});

export const resetEditProductDataAtom = atom(null, (_get, set) => {
  set(editProductDataAtom, createEmptyEditProductData());
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
