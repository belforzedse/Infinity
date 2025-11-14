"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services";
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

export default function Page() {
  const { isStoreManager, isLoading } = useCurrentUser();
  const router = useRouter();

  const initialData: Partial<CouponRule> = {
    terms: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (isLoading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (isStoreManager) {
    return (
      <StoreManagerNotice description="برای ایجاد تخفیفای عمومی باید با نقش سوپر ادمین وارد شوید." />
    );
  }

  return (
    <UpsertPageContentWrapper<CouponRule>
      config={config}
      data={initialData as CouponRule}
      onSubmit={async (data) => {
        try {
          await apiClient.post("/general-discounts", {
            data: {
              Type: data.type || "Discount",
              Amount: data.amount || 0,
              LimitAmount: data.limitAmount || null,
              StartDate: (data.startDate as any)?.value as Date,
              EndDate: (data.endDate as any)?.value as Date,
              IsActive: data.isActive,
              product_variations: data.terms.find((term) => term.category === "product")?.tags || [],
              product_categories:
                data.terms.find((term) => term.category === "category")?.tags || [],
            },
          });

          toast.success("قانون تخفیف با موفقیت ثبت شد");
          router.push("/super-admin/general-discounts");
        } catch (error: any) {
          const rawErrorMessage = extractErrorMessage(error);
          const message = translateErrorMessage(rawErrorMessage, "خطا در ثبت قانون تخفیف");
          toast.error(message);
        }
      }}
    />
  );
}
