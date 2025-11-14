"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/services";
import { useEffect, useState } from "react";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import StoreManagerNotice from "@/components/SuperAdmin/StoreManagerNotice";

export type CouponRule = {
  id: number;
  type: string;
  amount: number;
  limitAmount: number;
  startDate: Date;
  endDate: Date;
  terms: Term[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
};

type Term = {
  category: string;
  tags: string[];
  tagLabels?: Record<string, string>;
};

// Define the API response type
type ApiResponse = {
  data: {
    id: number;
    attributes: {
      Type: string;
      Amount: number;
      LimitAmount: number | null;
      StartDate: string;
      EndDate: string;
      IsActive: boolean;
      createdAt: string;
      updatedAt: string;
      product_variations?: {
        data: Array<{ id: number; attributes: { SKU: string } }>;
      };
      product_categories?: {
        data: Array<{ id: number; attributes: { Title: string } }>;
      };
    };
  };
};

export default function Page() {
  const { isStoreManager, isLoading } = useCurrentUser();
  const router = useRouter();
  const [data, setData] = useState<CouponRule | null>(null);
  const [loading, setLoading] = useState(true);

  const { id } = useParams();

  useEffect(() => {
    if (isStoreManager) {
      setLoading(false);
    }
  }, [isStoreManager]);

  useEffect(() => {
    if (isStoreManager || isLoading) {
      return;
    }

    const fetchData = async () => {
      try {
        const response = await apiClient.get<ApiResponse>(`/general-discounts/${id}?populate=*`);

        const rule = (response as any).data;

        // Transform the data to match our CouponRule type
        const transformedData: CouponRule = {
          id: rule.id,
          type: rule.attributes.Type || "Discount",
          amount: rule.attributes.Amount || 0,
          limitAmount: rule.attributes.LimitAmount || 0,
          startDate: rule.attributes.StartDate ? new Date(rule.attributes.StartDate) : new Date(),
          endDate: rule.attributes.EndDate ? new Date(rule.attributes.EndDate) : new Date(),
          isActive: rule.attributes.IsActive || false,
          terms: [],
          createdAt: rule.attributes.createdAt ? new Date(rule.attributes.createdAt) : new Date(),
          updatedAt: rule.attributes.updatedAt ? new Date(rule.attributes.updatedAt) : new Date(),
        };

        // Add product variations as terms with tagLabels
        if (
          rule.attributes.product_variations?.data &&
          rule.attributes.product_variations.data.length > 0
        ) {
          const productTagLabels: Record<string, string> = {};
          rule.attributes.product_variations.data.forEach((item: any) => {
            productTagLabels[item.id.toString()] = item.attributes.SKU;
          });

          transformedData.terms.push({
            category: "product",
            tags: rule.attributes.product_variations.data.map((item: any) => item.id.toString()),
            tagLabels: productTagLabels,
          });
        }

        // Add product categories as terms with tagLabels
        if (
          rule.attributes.product_categories?.data &&
          rule.attributes.product_categories.data.length > 0
        ) {
          const categoryTagLabels: Record<string, string> = {};
          rule.attributes.product_categories.data.forEach((item: any) => {
            categoryTagLabels[item.id.toString()] = item.attributes.Title;
          });

          transformedData.terms.push({
            category: "category",
            tags: rule.attributes.product_categories.data.map((item: any) => item.id.toString()),
            tagLabels: categoryTagLabels,
          });
        }

        setData(transformedData);
      } catch (error: any) {
        const rawErrorMessage = extractErrorMessage(error);
        const message = translateErrorMessage(rawErrorMessage, "خطا در دریافت اطلاعات قانون تخفیف");
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isStoreManager, isLoading]);

  if (isLoading || loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (isStoreManager) {
    return (
      <StoreManagerNotice description="برای ویرایش تخفیفای عمومی باید با نقش سوپر ادمین وارد شوید." />
    );
  }

  if (!data) {
    return <div>قانون تخفیف یافت نشد</div>;
  }

  return (
    <UpsertPageContentWrapper<CouponRule>
      config={config}
      data={data}
      onSubmit={async (formData) => {
        try {
          await apiClient.put(`/general-discounts/${id}`, {
            data: {
              Type: formData.type || "Discount",
              Amount: formData.amount || 0,
              LimitAmount: formData.limitAmount || null,
              StartDate: (formData.startDate as any)?.value as Date,
              EndDate: (formData.endDate as any)?.value as Date,
              IsActive: formData.isActive,
              product_variations:
                formData.terms.find((term) => term.category === "product")?.tags || [],
              product_categories:
                formData.terms.find((term) => term.category === "category")?.tags || [],
            },
          });

          toast.success("قانون تخفیف با موفقیت بروزرسانی شد");
          router.push("/super-admin/general-discounts");
        } catch (error: any) {
          const rawErrorMessage = extractErrorMessage(error);
          const message = translateErrorMessage(rawErrorMessage, "خطا در بروزرسانی قانون تخفیف");
          toast.error(message);
        }
      }}
    />
  );
}
