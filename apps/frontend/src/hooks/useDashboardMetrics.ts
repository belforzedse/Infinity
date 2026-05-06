"use client";

import { apiClient } from "@/services";
import type { Order } from "@/services/order";
import { useEffect, useState } from "react";

type PaginatedResponse<T> = {
  data: T[];
  meta?: {
    pagination?: {
      total?: number;
      page?: number;
      pageSize?: number;
      pageCount?: number;
    };
  };
};

export type DashboardMetric = {
  label: string;
  value: number;
  helper: string;
};

type StrapiItem<T> = {
  id: number;
  attributes: T;
};

type StrapiRelation<T> = {
  data: StrapiItem<T> | null;
};

type DashboardOrderAttributes = Partial<Order> & {
  Status?: string;
  OrderNumber?: string;
  PaymentStatus?: string;
  Total?: number;
  createdAt?: string;
  updatedAt?: string;
  contract?: StrapiRelation<{ Amount?: number }>;
  user?: StrapiRelation<{
    user_info?: StrapiRelation<{
      FirstName?: string;
      LastName?: string;
    }>;
  }>;
};

type DashboardOrderItem = StrapiItem<DashboardOrderAttributes>;

type DashboardState = {
  loading: boolean;
  metrics?: DashboardMetric[];
  latestOrders?: DashboardOrderItem[];
  latestRevenue?: number;
  error?: string;
};

const ORDERS_ENDPOINT = "/orders";
const PRODUCTS_ENDPOINT = "/products";
const USERS_ENDPOINT = "/users";

const buildCountUrl = (base: string, filters?: string) =>
  `${base}?pagination[page]=1&pagination[pageSize]=1${filters ? `&${filters}` : ""}`;

export function useDashboardMetrics() {
  const [state, setState] = useState<DashboardState>({ loading: true });

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async (endpoint: string) => {
      const response = await apiClient.get<PaginatedResponse<any>>(endpoint);
      return response?.meta?.pagination?.total ?? 0;
    };

    const fetchLatestOrders = async () => {
      const response = await apiClient.get<DashboardOrderItem[]>(
        `${ORDERS_ENDPOINT}?sort[0]=createdAt:desc&pagination[page]=1&pagination[pageSize]=3&populate[0]=user&populate[1]=contract&populate[2]=user.user_info`,
      );
      return response.data ?? [];
    };

    const load = async () => {
      try {
        const [ordersTotal, doneOrdersTotal, productsTotal, usersTotal, latestOrders] =
          await Promise.all([
            fetchCount(buildCountUrl(ORDERS_ENDPOINT)),
            fetchCount(buildCountUrl(ORDERS_ENDPOINT, "filters[Status][$eq]=Done")),
            fetchCount(buildCountUrl(PRODUCTS_ENDPOINT, "filters[Status][$eq]=Active")),
            fetchCount(buildCountUrl(USERS_ENDPOINT)),
            fetchLatestOrders(),
          ]);

        if (cancelled) return;

        const metrics: DashboardMetric[] = [
          {
            label: "کل سفارش‌ها",
            value: ordersTotal,
            helper: "تعداد سفارش‌های ثبت‌شده",
          },
          {
            label: "سفارش‌های انجام‌شده",
            value: doneOrdersTotal,
            helper: "سفارش‌هایی که وضعیت آن‌ها Done است",
          },
          {
            label: "محصولات فعال",
            value: productsTotal,
            helper: "محصولات در دسترس مشتریان",
          },
          {
            label: "کاربران",
            value: usersTotal,
            helper: "حساب‌های فعال",
          },
        ];

        const latestRevenue = latestOrders.reduce((sum, order) => {
          const amount = order.attributes.contract?.data?.attributes?.Amount ?? 0;
          return sum + Number(amount);
        }, 0);

        setState({
          loading: false,
          metrics,
          latestOrders,
          latestRevenue,
          error: undefined,
        });
      } catch (error: any) {
        if (cancelled) return;
        const message =
          typeof error === "object" && error !== null && "message" in error
            ? error.message
            : "خطا در بارگذاری آمار Dashboard";
        setState({ loading: false, error: message ?? "خطا در بارگذاری آمار Dashboard" });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
