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
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={
          "/orders?sort[0]=createdAt:desc&populate[0]=user&populate[1]=contract&populate[2]=user.user_info&populate[3]=contract"
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
