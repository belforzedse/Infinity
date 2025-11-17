"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import {
  createEmptyCategoryFormData,
  getCategoryFormConfig,
  type ProductCategoryForm,
} from "../../categoryFormConfig";
import { getCategoryById } from "@/services/super-admin/product/category/get";
import { updateCategory } from "@/services/super-admin/product/category/update";
import type { CategoryData } from "@/services/super-admin/product/category/create";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const categoryId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [initialData, setInitialData] = useState<ProductCategoryForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    let isMounted = true;
    let hasShownError = false; // Prevent duplicate error toasts

    const fetchCategory = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await getCategoryById(categoryId);

        if (!isMounted) return;

        // Debug: log the response structure
        if (process.env.NODE_ENV === "development") {
          console.log("Category API Response:", response);
        }

        // Handle Strapi response structure
        // getCategoryById returns ApiResponse<CategoryDetail>, so response.data is the CategoryDetail
        const payload = response?.data;

        if (!payload || !payload.id) {
          if (!hasShownError) {
            hasShownError = true;
            setHasError(true);
            toast.error("دسته‌بندی مورد نظر یافت نشد");
            setTimeout(() => {
              if (isMounted) {
                router.push("/super-admin/products/categories");
              }
            }, 2000);
          }
          return;
        }

        setInitialData({
          id: payload.id?.toString(),
          Title: payload.attributes?.Title ?? "",
          Slug: payload.attributes?.Slug ?? "",
          Parent:
            payload.attributes?.Parent ??
            payload.attributes?.parent?.data?.id?.toString() ??
            "",
          createdAt: payload.attributes?.createdAt
            ? new Date(payload.attributes.createdAt)
            : new Date(),
          updatedAt: payload.attributes?.updatedAt
            ? new Date(payload.attributes.updatedAt)
            : new Date(),
        });
      } catch (error: any) {
        if (!isMounted) return;

        console.error("Failed to load category:", error);

        if (!hasShownError) {
          hasShownError = true;
          setHasError(true);
          const rawErrorMessage = extractErrorMessage(error);
          const message = translateErrorMessage(rawErrorMessage, "دریافت اطلاعات با خطا مواجه شد");
          toast.error(message);
          setTimeout(() => {
            if (isMounted) {
              router.push("/super-admin/products/categories");
            }
          }, 2000);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCategory();

    return () => {
      isMounted = false;
    };
  }, [categoryId, router]); // Added router back but it's stable in Next.js

  const handleSubmit = async (formData: ProductCategoryForm) => {
    if (!categoryId) return;
    const title = formData.Title?.trim();
    const slug = formData.Slug?.trim();

    if (!title || !slug) {
      toast.error("نام و نامک دسته‌بندی الزامی است");
      return;
    }

    const payload: CategoryData = {
      Title: title,
      Slug: slug,
    };

    if (formData.Parent) {
      payload.Parent = formData.Parent;
    }

    try {
      await updateCategory(categoryId, payload);
      toast.success("تغییرات با موفقیت ذخیره شد");
      router.push("/super-admin/products/categories");
    } catch (error: any) {
      console.error("Failed to update category:", error);
      const rawErrorMessage = extractErrorMessage(error);
      const message = translateErrorMessage(rawErrorMessage, "به‌روزرسانی دسته‌بندی با خطا مواجه شد");
      toast.error(message);
    }
  };

  if (isLoading && !initialData) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-500">
        در حال بارگذاری اطلاعات دسته‌بندی...
      </div>
    );
  }

  if (hasError || (!isLoading && !initialData)) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-sm text-neutral-500">
        دسته‌بندی مورد نظر یافت نشد.
      </div>
    );
  }

  if (!initialData) {
    return null; // This should never happen due to earlier checks, but TypeScript needs it
  }

  return (
    <UpsertPageContentWrapper<ProductCategoryForm>
      config={getCategoryFormConfig({
        mode: "edit",
        excludeId: initialData.id ? Number(initialData.id) : undefined,
      })}
      data={initialData}
      onSubmit={handleSubmit}
    />
  );
}
