"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";

export default function OrdersPage() {
  useFreshDataOnPageLoad();
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
        url={(() => {
          const base =
            "/orders?sort[0]=createdAt:desc&populate[0]=user&populate[1]=contract&populate[2]=user.user_info&populate[3]=contract";

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
