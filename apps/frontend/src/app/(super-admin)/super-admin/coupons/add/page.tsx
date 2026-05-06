"use client";

import { useState } from "react";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiClient } from "@/services";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import StoreManagerNotice from "@/components/SuperAdmin/StoreManagerNotice";
import CouponProductSelector, {
  type SelectedProduct,
} from "@/components/SuperAdmin/Coupons/ProductSelector";
import CouponDeliverySelector, {
  type SelectedDelivery,
} from "@/components/SuperAdmin/Coupons/DeliverySelector";

export type Coupon = {
  id: number;
  code: string;
  type: string;
  amount: number;
  maxAmount: number;
  limit: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  minCartTotal?: number | null;
  maxCartTotal?: number | null;
};

export default function Page() {
  const { isStoreManager, isLoading } = useCurrentUser();
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<SelectedDelivery[]>([]);

  const initialData: Partial<Coupon> = {
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    minCartTotal: null,
    maxCartTotal: null,
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
    <>
      <UpsertPageContentWrapper<Coupon>
        config={config}
        data={initialData as Coupon}
        onSubmit={async (data) => {
          try {
            const parseNumericInput = (value: unknown): number | null => {
              if (value === undefined || value === null || value === "") {
                return null;
              }
              if (typeof value === "number") {
                return Number.isFinite(value) ? Math.round(value) : null;
              }
              if (typeof value === "string") {
                const normalized = value
                  .trim()
                  .replace(/[,٬\s]/g, "")
                  .replace(/[%٪]/g, "");
                if (!normalized) return null;
                const parsed = Number(normalized);
                return Number.isNaN(parsed) ? null : Math.round(parsed);
              }
              return null;
            };

            await apiClient.post("/discounts", {
              data: {
                Code: data.code || null,
                Type: data.type || null,
                Amount: parseNumericInput(data.amount),
                LimitAmount: parseNumericInput(data.maxAmount),
                LimitUsage: parseNumericInput(data.limit),
                StartDate: (data.startDate as any)?.value as Date,
                EndDate: (data.endDate as any)?.value as Date,
                IsActive: data.isActive,
                products: selectedProducts.map((p) => p.id),
                delivery_methods: selectedDeliveries.map((d) => d.id),
                MinCartTotal: parseNumericInput(data.minCartTotal),
                MaxCartTotal: parseNumericInput(data.maxCartTotal),
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
      <div className="mt-6 space-y-6">
        <CouponProductSelector
          products={selectedProducts}
          onAddProduct={(product) =>
            setSelectedProducts((prev) =>
              prev.some((p) => p.id === product.id) ? prev : [...prev, product],
            )
          }
          onRemoveProduct={(productId) =>
            setSelectedProducts((prev) => prev.filter((p) => p.id !== productId))
          }
        />

        <CouponDeliverySelector
          selected={selectedDeliveries}
          onToggle={(delivery) =>
            setSelectedDeliveries((prev) =>
              prev.some((d) => d.id === delivery.id)
                ? prev.filter((d) => d.id !== delivery.id)
                : [...prev, delivery],
            )
          }
        />
      </div>
    </>
  );
}
