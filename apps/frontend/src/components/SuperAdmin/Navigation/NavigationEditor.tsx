"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config, type NavigationFormData } from "@/app/(super-admin)/super-admin/navigation/edit/config";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import type { Navigation, NavigationCategory } from "@/types/super-admin/navigation";
import { getNavigation } from "@/services/super-admin/navigation/get";
import { updateNavigation } from "@/services/super-admin/navigation/update";
import CustomizationPreviewSection from "@/components/SuperAdmin/CustomizationPreviewSection";
import NavigationPreview from "./NavigationPreview";

function parseCategoriesForEmpty(value: NavigationFormData["product_categories"]): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function NavigationEditor() {
  const [data, setData] = useState<NavigationFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const navigationData = await getNavigation();

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
      usePanelLayout
      footer={(formData) => {
        const categories = parseCategoriesForEmpty(formData.product_categories);
        const isEmpty = categories.length === 0;
        return (
          <CustomizationPreviewSection
            title="پیش‌نمایش قالب"
            browserFrame
            empty={
              isEmpty
                ? {
                    title: "دسته‌بندی در منو وجود ندارد",
                    description:
                      "دسته‌بندی‌های منوی ناوبری را در فرم بالا انتخاب و ذخیره کنید تا پیش‌نمایش نمایش داده شود.",
                  }
                : undefined
            }
          >
            <NavigationPreview product_categories={formData.product_categories} />
          </CustomizationPreviewSection>
        );
      }}
      onSubmit={async (formData) => {
        try {
          let productCategories = formData.product_categories;

          if (typeof formData.product_categories === "string") {
            try {
              productCategories = JSON.parse(formData.product_categories);
            } catch {
              toast.error("خطا در فرمت دسته بندی‌ها");
              return;
            }
          }

          const navigationData: Navigation = {
            id: formData.id,
            product_categories: productCategories as NavigationCategory[],
            createdAt: formData.createdAt,
            updatedAt: new Date(),
          };

          await updateNavigation(navigationData);
          toast.success("ناوبری با موفقیت بروزرسانی شد");

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
