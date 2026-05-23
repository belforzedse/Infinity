"use client";

import PLPListFilterCategory from "./Category";
import AvailabilityFilter from "./Availability";
import PriceFilter from "./Price";
import PLPFilterBox from "@/components/Kits/PLP/FilterBox";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProductCategories } from "@/services/product/categories";
import { SORT_OPTIONS } from "@/components/PLP/sortOptions";
import { plpQueryOptions, plpQueryParsers } from "@/components/PLP/queryState";
import { getCategoryPlpHrefWithQuery } from "@/utils/plpRoutes";

interface Category {
  id: string;
  title: string;
}

interface FilterProps {
  showAvailableOnly?: boolean;
  categories?: Category[];
  isLoadingCategories?: boolean;
  selectedCategory?: string;
}

export default function Filter({
  showAvailableOnly = false,
  categories: categoriesProp,
  isLoadingCategories: isLoadingCategoriesProp,
  selectedCategory,
}: FilterProps) {
  const [query, setQuery] = useQueryStates(plpQueryParsers, plpQueryOptions);
  const { available, minPrice, maxPrice, sort } = query;
  const router = useRouter();
  const searchParams = useSearchParams();
  // State for categories
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(!categoriesProp);

  // Fetch categories on component mount
  useEffect(() => {
    if (categoriesProp) {
      return;
    }

    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setIsFetchingCategories(true);
        const categories = await getProductCategories({ sort: "Title:asc" });
        if (!isMounted) return;
        setLocalCategories(
          categories.map((cat) => ({
            id: cat.slug || String(cat.id),
            title: cat.name || cat.slug || String(cat.id),
          })),
        );
      } catch (error) {
        console.error("Error fetching categories:", error);
        if (!isMounted) return;
        setLocalCategories([]);
      } finally {
        if (!isMounted) return;
        setIsFetchingCategories(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [categoriesProp]);

  // Initialize available state from prop - run only once on mount
  useEffect(() => {
    if (showAvailableOnly && available !== "true") {
      void setQuery({ available: "true" });
    }
  }, [showAvailableOnly, available, setQuery]);

  // Category filter handler
  const handleCategorySelect = useCallback(
    (id: string) => {
      router.push(getCategoryPlpHrefWithQuery(id, searchParams));
    },
    [router, searchParams],
  );

  // Availability filter handler
  const handleAvailabilityChange = useCallback(
    (checked: boolean) => {
      void setQuery({ available: checked ? "true" : null });
    },
    [setQuery],
  );

  // Price filter handler
  const handlePriceChange = useCallback(
    (min: number, max: number) => {
      void setQuery({
        minPrice: min.toString(),
        maxPrice: max.toString(),
      });
    },
    [setQuery],
  );

  const handleSortToggle = useCallback(
    (value: string) => {
      void setQuery({
        page: 1,
        sort: sort === value ? null : value,
      });
    },
    [setQuery, sort],
  );

  const handleSortClear = useCallback(() => {
    void setQuery({ page: 1, sort: null });
  }, [setQuery]);

  const resolvedCategories = categoriesProp ?? localCategories;
  const resolvedIsLoading = categoriesProp ? isLoadingCategoriesProp ?? false : isFetchingCategories;

  return (
    <div className="flex flex-col gap-3">
      <PLPListFilterCategory
        value={selectedCategory || ""}
        title="دسته بندی محصولات"
        filterOptions={resolvedCategories.map((cat) => ({
          id: cat.id,
          title: cat.title,
        }))}
        onOptionSelect={(optionId: string | number) => handleCategorySelect(optionId.toString())}
        isLoading={resolvedIsLoading}
      />

      <AvailabilityFilter
        onChange={handleAvailabilityChange}
        defaultChecked={available === "true"}
      />

      <PLPFilterBox title="قیمت">
        <PriceFilter
          minPriceValue={minPrice ? parseInt(minPrice) : undefined}
          maxPriceValue={maxPrice ? parseInt(maxPrice) : undefined}
          minPrice={20000}
          maxPrice={50000000}
          onPriceChange={handlePriceChange}
        />
      </PLPFilterBox>

      <PLPFilterBox title="مرتب سازی" defaultOpen>
        <div className="flex flex-col gap-2">
          {SORT_OPTIONS.map((option) => {
            const isActive = sort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleSortToggle(option.value)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-2 text-sm font-semibold transition ${isActive ? "border-pink-500 bg-pink-50 text-pink-700" : "border-slate-200 bg-white text-neutral-700 hover:border-pink-200"}`}
              >
                <span>{option.label}</span>
                <span
                  className={`h-4 w-4 rounded-full border transition ${isActive ? "border-pink-500 bg-pink-500" : "border-slate-300 bg-transparent"}`}
                />
              </button>
            );
          })}
          {sort && (
            <button
              type="button"
              onClick={handleSortClear}
              className="text-xs text-right text-pink-600 underline-offset-2 hover:text-pink-700"
            >
              حذف مرتب‌سازی
            </button>
          )}
        </div>
      </PLPFilterBox>

      {/* <PLPFilterBoxWithItems
        title="جنس"
        inputPlaceholder="جنس مد نظرتونو سرچ کنین"
        hasSearch
        options={[
          { id: "1", label: "جنس 1" },
          { id: "2", label: "جنس 2" },
          { id: "3", label: "جنس 3" },
          { id: "4", label: "جنس 4" },
          { id: "5", label: "جنس 5" },
          { id: "6", label: "جنس 6" },
          { id: "7", label: "جنس 7" },
          { id: "8", label: "جنس 8" },
          { id: "9", label: "جنس 9" },
        ]}
        onOptionSelect={handleMaterialSelect}
      />

      <PLPFilterBoxWithItems
        title="مناسب فصل"
        options={[
          { id: "1", label: "بهار" },
          { id: "2", label: "تابستان" },
          { id: "3", label: "پاییز" },
          { id: "4", label: "زمستان" },
        ]}
        onOptionSelect={handleSeasonSelect}
      />

      <PLPFilterBoxWithItems
        title="جنسیت"
        options={[
          { id: "1", label: "مردانه" },
          { id: "2", label: "زنانه" },
          { id: "3", label: "کودک" },
        ]}
        onOptionSelect={handleGenderSelect}
      />

      <PLPFilterBoxWithItems
        title="موارد استفاده"
        hasSearch
        options={[
          { id: "1", label: "موارد استفاده 1" },
          { id: "2", label: "موارد استفاده 2" },
          { id: "3", label: "موارد استفاده 3" },
        ]}
        onOptionSelect={handleUsageSelect}
      /> */}
    </div>
  );
}
