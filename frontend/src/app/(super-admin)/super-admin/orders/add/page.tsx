"use client";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export type Order = {
  id: number;
  orderDate: Date;
  orderStatus: string;
  userId: string;
  description: string;
  phoneNumber: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
  shipping: number;
  subtotal: number;
  note: string;
  total: number;
};

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color: string;
  image: string;
};

export default function Page() {
  const router = useRouter();

  return (
    <UpsertPageContentWrapper<Order>
      config={config}
      onSubmit={async (data) => {
        try {
          await apiClient.post(
            "/orders",
            {
              data: {
                Description: data.description,
                Status: data.orderStatus,
                user: data.userId,
                Date: (data.orderDate as any).value as Date,
                Type: "Manual",
              },
            },
            {
              headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            }
          );

          toast.success("سفارش با موفقیت ثبت شد");
          router.push("/super-admin/orders");
        } catch (error) {
          toast.error("خطایی رخ داده است");
        }
      }}
    />
  );
}
