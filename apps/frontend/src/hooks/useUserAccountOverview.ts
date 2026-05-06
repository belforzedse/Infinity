"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import OrderService from "@/services/order";
import ProductLikeService from "@/services/product/product-like";
import WalletService from "@/services/wallet";
import UserService from "@/services/user";

interface OverviewOrder {
  id: number;
  createdAt: string;
  status: string;
  total: number;
}

export interface UserAccountOverview {
  orders: {
    total: number;
    active: number;
    delivered: number;
    cancelled: number;
    lastOrderDate: string | null;
    recent: OverviewOrder[];
  };
  wallet: {
    balance: number;
  };
  favorites: {
    count: number;
  };
  addresses: {
    count: number;
  };
}

const defaultOverview: UserAccountOverview = {
  orders: {
    total: 0,
    active: 0,
    delivered: 0,
    cancelled: 0,
    lastOrderDate: null,
    recent: [],
  },
  wallet: {
    balance: 0,
  },
  favorites: {
    count: 0,
  },
  addresses: {
    count: 0,
  },
};

interface OverviewState {
  data: UserAccountOverview;
  loading: boolean;
  error: string | null;
}

const getOrderTotal = (order: any) => {
  if (!order?.order_items?.length) return order?.ShippingCost || 0;

  const itemsTotal = order.order_items.reduce((sum: number, item: any) => {
    const count = Number(item?.Count || 0);
    const perAmount = Number(item?.PerAmount || 0);
    return sum + count * perAmount;
  }, 0);

  return itemsTotal + Number(order?.ShippingCost || 0);
};

const normaliseOrderStatus = (status: string | undefined) => {
  if (!status) return "other";
  const value = status.toLowerCase();
  if (value === "done" || value === "delivered" || value === " تحویل داده شده") return "delivered";
  if (value === "cancelled" || value === "canceled" || value === "لغو شده") return "cancelled";
  if (
    value === "paying" ||
    value === "pending" ||
    value === "started" ||
    value === "processing" ||
    value === "shipment" ||
    value === "shipped" ||
    value === "جاری"
  )
    return "active";
  return "other";
};

export default function useUserAccountOverview() {
  const [state, setState] = useState<OverviewState>({
    data: defaultOverview,
    loading: true,
    error: null,
  });

  const fetchOverview = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const [ordersResult, favoritesResult, walletResult, addressesResult] = await Promise.allSettled([
        OrderService.getMyOrders(1, 10),
        ProductLikeService.getUserFavorites(1, 1),
        WalletService.getMyWallet(),
        UserService.addresses.getAll(),
      ]);

      const overview: UserAccountOverview = {
        orders: {
          total: 0,
          active: 0,
          delivered: 0,
          cancelled: 0,
          lastOrderDate: null,
          recent: [],
        },
        wallet: { balance: 0 },
        favorites: { count: 0 },
        addresses: { count: 0 },
      };

      if (ordersResult.status === "fulfilled") {
        const ordersData = ordersResult.value.data || [];
        const metaTotal = ordersResult.value.meta?.pagination?.total;

        overview.orders.total =
          typeof metaTotal === "number" && !Number.isNaN(metaTotal)
            ? metaTotal
            : Array.isArray(ordersData)
              ? ordersData.length
              : 0;

        let active = 0;
        let delivered = 0;
        let cancelled = 0;

        const sortedRecent = [...ordersData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        overview.orders.lastOrderDate = sortedRecent[0]?.createdAt || null;

        overview.orders.recent = sortedRecent.slice(0, 3).map((order) => ({
          id: order.id,
          createdAt: order.createdAt,
          status: order.Status,
          total: getOrderTotal(order),
        }));

        ordersData.forEach((order) => {
          const normalised = normaliseOrderStatus(order?.Status);
          if (normalised === "active") active += 1;
          if (normalised === "delivered") delivered += 1;
          if (normalised === "cancelled") cancelled += 1;
        });

        overview.orders.active = active;
        overview.orders.delivered = delivered;
        overview.orders.cancelled = cancelled;
      }

      if (favoritesResult.status === "fulfilled") {
        const metaTotal = favoritesResult.value.meta?.pagination?.total;
        overview.favorites.count =
          typeof metaTotal === "number" && !Number.isNaN(metaTotal)
            ? metaTotal
            : Array.isArray(favoritesResult.value.data)
              ? favoritesResult.value.data.length
              : 0;
      }

      if (walletResult.status === "fulfilled") {
        overview.wallet.balance = Number(walletResult.value?.data?.balance || 0);
      }

      if (addressesResult.status === "fulfilled") {
        overview.addresses.count = Array.isArray(addressesResult.value)
          ? addressesResult.value.length
          : 0;
      }

      setState({
        data: overview,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "خطایی در دریافت خلاصه حساب کاربری رخ داده است";

      setState({
        data: defaultOverview,
        loading: false,
        error: message,
      });
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const hasData = useMemo(() => {
    const { data } = state;
    return (
      data.orders.total > 0 ||
      data.wallet.balance > 0 ||
      data.favorites.count > 0 ||
      data.addresses.count > 0
    );
  }, [state]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchOverview,
    hasData,
  };
}
