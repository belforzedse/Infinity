"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
// removed unused import: useRouter from "next/navigation"
import { useEffect, useState } from "react";
import type { Navigation, NavigationCategory } from "@/types/super-admin/navigation";
import { getNavigation } from "@/services/super-admin/navigation/get";
import { updateNavigation } from "@/services/super-admin/navigation/update";

// Form data interface that handles both string and array types for product_categories
interface NavigationFormData extends Omit<Navigation, "product_categories"> {
  product_categories: NavigationCategory[] | string;
}

export default function NavigationEditPage() {
  // removed unused: router
  const [data, setData] = useState<NavigationFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const navigationData = await getNavigation();

        // Convert product_categories to JSON string for the categories-list component
        const formattedData: NavigationFormData = {
          ...navigationData,
          product_categories:
            typeof navigationData.product_categories === "object"
              ? JSON.stringify(navigationData.product_categories, null, 2)
              : navigationData.product_categories,
        };

        setData(formattedData);
      } catch (error) {
        toast.error("خطا در دریافت اطلاعات ناوبری");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!data) {
    return <div>اطلاعات ناوبری یافت نشد</div>;
  }

  return (
    <UpsertPageContentWrapper<NavigationFormData>
      config={config}
      data={data}
      onSubmit={async (formData) => {
        try {
          // Parse the categories from JSON string if needed
          let productCategories = formData.product_categories;

          // If the field is a string (which it will be from our component), parse it
          if (typeof formData.product_categories === "string") {
            try {
              productCategories = JSON.parse(formData.product_categories);
            } catch {
              toast.error("خطا در فرمت دسته بندی‌ها");
              return;
            }
          }

          // Create the data to send to API
          const navigationData: Navigation = {
            id: formData.id,
            product_categories: productCategories as NavigationCategory[],
            createdAt: formData.createdAt,
            updatedAt: new Date(),
          };

          await updateNavigation(navigationData);
          toast.success("ناوبری با موفقیت بروزرسانی شد");

          // Refresh the data
          const updatedNavigation = await getNavigation();
          const updatedFormData: NavigationFormData = {
            ...updatedNavigation,
            product_categories: JSON.stringify(updatedNavigation.product_categories, null, 2),
          };
          setData(updatedFormData);
        } catch (error) {
          toast.error("خطایی رخ داده است");
          console.error(error);
        }
      }}
    />
  );
}
