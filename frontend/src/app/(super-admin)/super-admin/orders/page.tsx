"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";

export default function OrdersPage() {
  return (
    <ContentWrapper
      title="سفارشات"
      filterOptions={[
        { id: "[id]", title: "شماره سفارش" },
        { id: "[contract][Amount]", title: "مبلغ" },
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
      <SuperAdminTable
        enableSelection
        bulkOptions={[
          { id: "markDone", title: "علامت‌گذاری به تکمیل" },
          { id: "print", title: "پرینت فاکتور" },
        ]}
        getRowId={(row) => (row as any)?.id?.toString?.()}
        onBulkAction={async (actionId, rows) => {
          if (actionId === "print") {
            rows.forEach((r) => {
              const id = (r as any)?.id;
              if (id) window.open(`/super-admin/orders/print/${id}`, "_blank");
            });
            return;
          }
          if (actionId === "markDone") {
            const { apiClient } = await import("@/services");
            const { STRAPI_TOKEN } = await import("@/constants/api");
            await Promise.all(
              rows.map((r) =>
                apiClient.put(
                  `/orders/${(r as any).id}`,
                  { data: { Status: "Done" } },
                  { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } },
                ),
              ),
            );
          }
        }}
        columns={columns}
        url={
          "/orders?sort[0]=createdAt:desc&populate[0]=user&populate[1]=contract&populate[2]=user.user_info&populate[3]=contract"
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
