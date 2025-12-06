"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns, bulkPrintOrders, Order } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useAtom } from "jotai";
import { refreshTable } from "@/components/SuperAdmin/Table";
import toast from "react-hot-toast";
import {
  changeOrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  OrderLifecycleStatus,
} from "@/services/super-admin/orders/adjustItems";

export default function OrdersPage() {
  useFreshDataOnPageLoad();
  const [, setRefresh] = useAtom(refreshTable);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebouncedCallback((query: string) => {
    setDebouncedSearchQuery(query);
  }, 500);

  // Trigger debounced search when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Cancel any pending debounced calls on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const bulkOptions = useMemo(() => {
    const statusOptions = ORDER_STATUSES.map((status) => ({
      id: `status-${status}`,
      title: `وضعیت ${ORDER_STATUS_LABELS[status]}`,
    }));

    return [{ id: "print", title: "پرینت دسته‌ای" }, ...statusOptions];
  }, []);

  const handleBulkAction = useCallback(
    async (actionId: string, selectedRows: Order[]) => {
      if (actionId === "print") {
        bulkPrintOrders(selectedRows.map((row) => row.id));
        return;
      }

      if (actionId.startsWith("status-")) {
        const statusKey = actionId.replace("status-", "") as OrderLifecycleStatus;
        try {
          await Promise.all(
            selectedRows.map((row) => changeOrderStatus(row.id, statusKey)),
          );
          toast.success(
            `${selectedRows.length} سفارش به وضعیت ${ORDER_STATUS_LABELS[statusKey]} منتقل شد.`,
          );
          setRefresh(true);
        } catch (error) {
          console.error("Bulk order status update error:", error);
          toast.error("خطا در بروزرسانی وضعیت سفارش‌ها");
        }
      }
    },
    [setRefresh],
  );

  return (
    <ContentWrapper
      title="سفارشات"
      filterOptions={[
        { id: "[id]", title: "شماره سفارش" },
        { id: "[contract][Amount]", title: "مبلغ" },
        {
          id: "[contract][external_id]",
          title: "شماره تراکنش (Transaction ID)",
        },
        { id: "[Description]", title: "توضیحات" },
        { id: "[user][user_info][FirstName]", title: "نام" },
        { id: "[user][user_info][LastName]", title: "نام خانوادگی" },
        { id: "[user][Phone]", title: "شماره تلفن" },
      ]}
      hasAddButton
      addButtonText="افزودن سفارش جدید"
      addButtonPath="/super-admin/orders/add"
      hasFilterButton
      hasPagination
    >
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-neutral-600">جستجوی شماره تراکنش:</label>
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو شماره تراکنش اسنپ! پی ..."
            className="text-sm w-80 rounded-lg border border-neutral-300 px-3 py-1 pr-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery !== debouncedSearchQuery && (
            <div className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            </div>
          )}
        </div>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setDebouncedSearchQuery("");
            }}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            پاک کردن
          </button>
        )}
        {debouncedSearchQuery && (
          <span className="text-xs text-green-600">
            نتایج برای: &quot;{debouncedSearchQuery}&quot;
          </span>
        )}
      </div>
      <SuperAdminTable
        _removeActions
        columns={columns}
        enableSelection
        bulkOptions={bulkOptions}
        onBulkAction={handleBulkAction}
        url={(() => {
          // Fixed: Removed duplicate populate[3]=contract (was populating contract twice)
          const base =
            "/orders?sort[0]=createdAt:desc&populate[0]=user&populate[1]=contract&populate[2]=user.user_info";

          if (debouncedSearchQuery.trim()) {
            return (
              base +
              `&filters[contract][external_id][$containsi]=${encodeURIComponent(debouncedSearchQuery.trim())}`
            );
          }

          return base;
        })()}
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
