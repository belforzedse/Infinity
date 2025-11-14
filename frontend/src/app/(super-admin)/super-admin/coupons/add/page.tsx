"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import StoreManagerNotice from "@/components/SuperAdmin/StoreManagerNotice";

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

export default function Page() {
  const { isStoreManager, isLoading } = useCurrentUser();
  const router = useRouter();

  const initialData: Partial<Coupon> = {
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
      <StoreManagerNotice description="برای مدیریت یا ایجاد کد تخفیف باید با نقش سوپر ادمین وارد شوید." />
    );
  }

  return (
    <UpsertPageContentWrapper<Coupon>
      config={config}
      data={initialData as Coupon}
      onSubmit={async (data) => {
        try {
          await apiClient.post("/discounts", {
            data: {
              Code: data.code || null,
              Type: data.type || null,
              Amount: data.amount || null,
              LimitAmount: data.maxAmount || null,
              LimitUsage: data.limit || null,
              StartDate: (data.startDate as any)?.value as Date,
              EndDate: (data.endDate as any)?.value as Date,
              IsActive: data.isActive,
              local_users: data.terms.find((term) => term.category === "user")?.tags || [],
              product_variations:
                data.terms.find((term) => term.category === "product")?.tags || [],
            },
          });

          toast.success("کد تخفیف با موفقیت ثبت شد");
          router.push("/super-admin/coupons");
        } catch (error: any) {
          const rawErrorMessage = extractErrorMessage(error);
          const message = translateErrorMessage(rawErrorMessage, "خطا در ثبت کد تخفیف");
          toast.error(message);
        }
      }}
    />
  );
}
