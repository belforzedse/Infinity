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
      fetch(`${API_BASE_URL}/product-categories?filters[Slug][$eq]=${category}`)
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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-32 h-32 mb-6 relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-gray-300"
        >
          <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">محصولی یافت نشد</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        متأسفانه در حال حاضر هیچ {categoryTitle} در این دسته‌بندی موجود نیست.
        لطفاً بعداً دوباره بررسی کنید یا به صفحه اصلی برگردید.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          بازگشت به صفحه اصلی
        </Link>
        <Link
          href="/plp"
          className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
        >
          مشاهده همه محصولات
        </Link>
      </div>
    </div>
  );
}
