"use client";

import PLPListFilterCategory from "./Category";
import AvailabilityFilter from "./Availability";
import PriceFilter from "./Price";
import PLPFilterBox from "@/components/Kits/PLP/FilterBox";
import PLPFilterBoxWithItems from "@/components/Kits/PLP/FilterBoxWithItems";
import { useQueryState } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, ENDPOINTS } from "@/constants/api";
import { categories as staticCategories } from "@/constants/categories";

interface FilterProps {
  showAvailableOnly?: boolean;
}

interface Category {
  id: string;
  title: string;
}

export default function Filter({ showAvailableOnly = false }: FilterProps) {
  // URL state management with nuqs
  const [category, setCategory] = useQueryState("category");
  const [available, setAvailable] = useQueryState("available");
  const [minPrice, setMinPrice] = useQueryState("minPrice");
  const [maxPrice, setMaxPrice] = useQueryState("maxPrice");
  const [, setSize] = useQueryState("size");

  // State for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PRODUCT.CATEGORY}`);

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          setCategories(
            data.data.map((cat: any) => ({
              id: cat.attributes.Slug || cat.id.toString(),
              title: cat.attributes.Title,
            })),
          );
        } else {
          setCategories(
            staticCategories.map((cat) => ({
              id: cat.slug,
              title: cat.name,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories(
          staticCategories.map((cat) => ({
            id: cat.slug,
            title: cat.name,
          })),
        );
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize available state from prop - run only once on mount
  useEffect(() => {
    if (showAvailableOnly && available !== "true") {
      setAvailable("true");
    }
  }, [showAvailableOnly, setAvailable]); // Remove 'available' from deps to prevent loops

  // Category filter handler
  const handleCategorySelect = useCallback(
    (id: string) => {
      setCategory(id);
    },
    [setCategory],
  );

  // Availability filter handler
  const handleAvailabilityChange = useCallback(
    (checked: boolean) => {
      setAvailable(checked ? "true" : null);
    },
    [setAvailable],
  );

  // Price filter handler
  const handlePriceChange = useCallback(
    (min: number, max: number) => {
      setMinPrice(min.toString());
      setMaxPrice(max.toString());
    },
    [setMinPrice, setMaxPrice],
  );

  // Size filter handler
  const handleSizeSelect = useCallback(
    (id: string) => {
      setSize(id);
    },
    [setSize],
  );

  return (
    <div className="flex flex-col gap-3">
      <PLPListFilterCategory
        value={category || ""}
        title="دسته بندی محصولات"
        filterOptions={categories.map((cat) => ({
          id: cat.id,
          title: cat.title,
        }))}
        onOptionSelect={(optionId: string | number) => handleCategorySelect(optionId.toString())}
        isLoading={isLoadingCategories}
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
          maxPrice={5000000}
          onPriceChange={handlePriceChange}
        />
      </PLPFilterBox>

      <PLPFilterBoxWithItems
        title="سایز"
        options={[
          { id: "1", label: "سایز 1" },
          { id: "2", label: "سایز 2" },
          { id: "3", label: "سایز 3" },
          { id: "4", label: "سایز 4" },
          { id: "5", label: "سایز 5" },
          { id: "6", label: "سایز 6" },
          { id: "7", label: "سایز 7" },
          { id: "8", label: "سایز 8" },
          { id: "9", label: "سایز 9" },
        ]}
        onOptionSelect={handleSizeSelect}
      />

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
