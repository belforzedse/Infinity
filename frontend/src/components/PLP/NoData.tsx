"use client";

import Link from "next/link";
import { API_BASE_URL } from "@/constants/api";
import { useEffect, useState } from "react";

interface NoDataProps {
  category?: string;
}

export default function NoData({ category }: NoDataProps) {
  const [categoryTitle, setCategoryTitle] = useState("محصولات");

  useEffect(() => {
    if (category) {
      const safeCategory = encodeURIComponent(category);
      fetch(`${API_BASE_URL}/product-categories?filters[Slug][$eq]=${safeCategory}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.data.length > 0) {
            setCategoryTitle(data.data[0].attributes.Title);
          }
        })
        .catch((error) => {
          console.error("Error fetching category data:", error);
        });
    }
  }, [category]);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6 h-32 w-32">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full text-gray-300"
        >
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      </div>
      <h2 className="text-2xl mb-2 font-bold text-gray-800">محصولی یافت نشد</h2>
      <p className="mb-8 max-w-md text-gray-600">
        متأسفانه در حال حاضر هیچ {categoryTitle} در این دسته‌بندی موجود نیست. لطفاً بعداً دوباره
        بررسی کنید یا به صفحه اصلی برگردید.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="bg-primary hover:bg-primary/90 rounded-lg px-6 py-3 text-white transition-colors"
        >
          بازگشت به صفحه اصلی
        </Link>
        <Link
          href="/plp"
          className="rounded-lg bg-gray-100 px-6 py-3 text-gray-800 transition-colors hover:bg-gray-200"
        >
          مشاهده همه محصولات
        </Link>
      </div>
    </div>
  );
}
