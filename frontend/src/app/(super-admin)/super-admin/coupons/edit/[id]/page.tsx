"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/services";
import { useEffect, useState } from "react";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";

export type Coupon = {
  id: number;
  code: string;
  type: string;
  amount: number;
  maxAmount: number;
  limit: number;
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
type DiscountResponse = {
  data: {
    id: number;
    attributes: {
      Code: string;
      Type: string;
      Amount: number;
      LimitAmount: number;
      LimitUsage: number;
      StartDate: string;
      EndDate: string;
      IsActive: boolean;
      createdAt: string;
      updatedAt: string;
      local_users: {
        data: Array<{
          id: number;
          attributes: {
            Phone: string;
          };
        }>;
      };
      product_variations: {
        data: Array<{
          id: number;
          attributes: {
            SKU: string;
          };
        }>;
      };
    };
  };
};

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<DiscountResponse>(`/discounts/${id}?populate=*`);

        const discount = (response as any).data.attributes;

        // Create tagLabels objects for users and products
        const userTagLabels: Record<string, string> = {};
        const productTagLabels: Record<string, string> = {};

        // Populate user tag labels
        if (discount.local_users?.data) {
          discount.local_users.data.forEach((user: any) => {
            userTagLabels[user.id.toString()] = user.attributes.Phone;
          });
        }

        // Populate product tag labels
        if (discount.product_variations?.data) {
          discount.product_variations.data.forEach((product: any) => {
            productTagLabels[product.id.toString()] = product.attributes.SKU;
          });
        }

        // Transform the data to match our Coupon type
        const couponData: Coupon = {
          id: parseInt(id as string),
          code: discount.Code || "",
          type: discount.Type || "",
          amount: discount.Amount || 0,
          maxAmount: discount.LimitAmount || 0,
          limit: discount.LimitUsage || 0,
          startDate: new Date(discount.StartDate),
          endDate: new Date(discount.EndDate),
          terms: [
            {
              category: "user",
              tags: discount.local_users?.data?.map((user: any) => user.id.toString()) || [],
              tagLabels: userTagLabels,
            },
            {
              category: "product",
              tags:
                discount.product_variations?.data?.map((product: any) => product.id.toString()) ||
                [],
              tagLabels: productTagLabels,
            },
          ],
          createdAt: new Date(discount.createdAt),
          updatedAt: new Date(discount.updatedAt),
          isActive: discount.IsActive || false,
        };

        setData(couponData);
      } catch (error: any) {
        const rawErrorMessage = extractErrorMessage(error);
        const message = translateErrorMessage(rawErrorMessage, "خطا در دریافت اطلاعات کد تخفیف");
        toast.error(message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!data) {
    return <div>کد تخفیف یافت نشد</div>;
  }

  return (
    <UpsertPageContentWrapper<Coupon>
      config={config}
      data={data}
      onSubmit={async (formData) => {
        try {
          await apiClient.put(`/discounts/${id}`, {
            data: {
              Code: formData.code || null,
              Type: formData.type || null,
              Amount: formData.amount || null,
              LimitAmount: formData.maxAmount || null,
              LimitUsage: formData.limit || null,
              StartDate: (formData.startDate as any)?.value as Date,
              EndDate: (formData.endDate as any)?.value as Date,
              IsActive: formData.isActive,
              local_users: formData.terms.find((term) => term.category === "user")?.tags || [],
              product_variations:
                formData.terms.find((term) => term.category === "product")?.tags || [],
            },
          });

          toast.success("کد تخفیف با موفقیت بروزرسانی شد");
          router.push("/super-admin/coupons");
        } catch (error: any) {
          const rawErrorMessage = extractErrorMessage(error);
          const message = translateErrorMessage(rawErrorMessage, "خطا در بروزرسانی کد تخفیف");
          toast.error(message);
          console.error(error);
        }
      }}
    />
  );
}
