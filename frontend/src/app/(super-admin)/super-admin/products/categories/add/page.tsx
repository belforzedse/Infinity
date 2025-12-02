"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createCategory, type CategoryData } from "@/services/super-admin/product/category/create";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import {
  createEmptyCategoryFormData,
  getCategoryFormConfig,
  type ProductCategoryForm,
} from "../categoryFormConfig";

export default function AddCategoryPage() {
  const router = useRouter();

  const handleSubmit = async (formData: ProductCategoryForm) => {
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
      await createCategory(payload);
      toast.success("دسته‌بندی با موفقیت ایجاد شد");
      router.push("/super-admin/products/categories");
    } catch (error: any) {
      console.error("Failed to create category:", error);
      const rawErrorMessage = extractErrorMessage(error);
      const message = translateErrorMessage(rawErrorMessage, "ایجاد دسته‌بندی با خطا مواجه شد");
      toast.error(message);
    }
  };

  return (
    <UpsertPageContentWrapper<ProductCategoryForm>
      config={getCategoryFormConfig({ mode: "create" })}
      data={createEmptyCategoryFormData()}
      onSubmit={handleSubmit}
    />
  );
}
