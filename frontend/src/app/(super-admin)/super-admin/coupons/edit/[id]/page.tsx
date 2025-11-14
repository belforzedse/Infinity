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
      MinCartTotal?: number | null;
      MaxCartTotal?: number | null;
      createdAt: string;
      updatedAt: string;
      products: {
        data: Array<{
          id: number;
          attributes: {
            Title: string;
            SKU: string;
          };
        }>;
      };
      delivery_methods: {
        data: Array<{
          id: number;
          attributes: {
            Title: string;
          };
        }>;
      };
    };
  };
};

export default function Page() {
  const { isStoreManager, isLoading } = useCurrentUser();
  const router = useRouter();
  const [data, setData] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState<SelectedDelivery[]>([]);

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
        const populate = "?populate[products]=*&populate[delivery_methods]=*";
        const response = await apiClient.get<DiscountResponse>(`/discounts/${id}${populate}`);

        const discount = (response as any).data.attributes;

        // Create tagLabels objects
        const productTagLabels: Record<string, string> = {};
        const deliveryTagLabels: Record<string, string> = {};

        if (discount.products?.data) {
          discount.products.data.forEach((product: any) => {
            productTagLabels[product.id.toString()] =
              product.attributes?.Title || product.attributes?.SKU || `محصول ${product.id}`;
          });
        }

        if (discount.delivery_methods?.data) {
          discount.delivery_methods.data.forEach((method: any) => {
            deliveryTagLabels[method.id.toString()] =
              method.attributes?.Title || `روش ارسال ${method.id}`;
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
          createdAt: new Date(discount.createdAt),
          updatedAt: new Date(discount.updatedAt),
          isActive: discount.IsActive || false,
          minCartTotal: discount.MinCartTotal ?? null,
          maxCartTotal: discount.MaxCartTotal ?? null,
        };

        setData(couponData);
        setSelectedProducts(
          (discount.products?.data || []).map((product: any) => ({
            id: product.id,
            title: productTagLabels[product.id.toString()],
            sku: product.attributes?.SKU,
          })),
        );
        setSelectedDeliveries(
          (discount.delivery_methods?.data || []).map((method: any) => ({
            id: method.id,
            title: deliveryTagLabels[method.id.toString()],
          })),
        );
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
  }, [id, isStoreManager, isLoading]);

  if (isLoading || loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (isStoreManager) {
    return (
      <StoreManagerNotice description="برای ویرایش کد تخفیف باید با نقش سوپر ادمین وارد شوید." />
    );
  }

  if (!data) {
    return <div>کد تخفیف یافت نشد</div>;
  }

  return (
    <>
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
                products: selectedProducts.map((product) => product.id),
                delivery_methods: selectedDeliveries.map((delivery) => delivery.id),
                MinCartTotal:
                  formData.minCartTotal !== undefined && formData.minCartTotal !== null
                    ? Number(formData.minCartTotal)
                    : null,
                MaxCartTotal:
                  formData.maxCartTotal !== undefined && formData.maxCartTotal !== null
                    ? Number(formData.maxCartTotal)
                    : null,
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
