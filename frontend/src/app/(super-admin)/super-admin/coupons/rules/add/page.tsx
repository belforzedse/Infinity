"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
import { STRAPI_TOKEN } from "@/constants/api";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services";

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

export default function Page() {
  const router = useRouter();

  const initialData: Partial<CouponRule> = {
    terms: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <UpsertPageContentWrapper<CouponRule>
      config={config}
      data={initialData as CouponRule}
      onSubmit={async (data) => {
        try {
          await apiClient.post(
            "/general-discounts",
            {
              data: {
                Type: data.type || "Discount",
                Amount: data.amount || 0,
                LimitAmount: data.limitAmount || null,
                StartDate: (data.startDate as any)?.value as Date,
                EndDate: (data.endDate as any)?.value as Date,
                IsActive: data.isActive,
                product_variations:
                  data.terms.find((term) => term.category === "product")
                    ?.tags || [],
                product_categories:
                  data.terms.find((term) => term.category === "category")
                    ?.tags || [],
              },
            },
            {
              headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            }
          );

          toast.success("قانون تخفیف با موفقیت ثبت شد");
          router.push("/super-admin/coupons/rules");
        } catch (error) {
          toast.error("خطایی رخ داده است");
        }
      }}
    />
  );
}
