"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { columns, MobileTable } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";

export default function CartsPage() {
  return (
    <ContentWrapper
      title="سبد خرید"
      hasFilterButton
      hasPagination
      filterOptions={[
        { id: "[user][user_info][FirstName]", title: "نام فرد" },
        { id: "[user][user_info][LastName]", title: "نام خانوادگی فرد" },
        { id: "[user][user_info][Phone]", title: "شماره تماس فرد" },
        { id: "[createdAt]", title: "تاریخ ایجاد" },
      ]}
    >
      <SuperAdminTable
        columns={columns}
        removeActions
        url="/carts?populate[0]=user&populate[1]=cart_items&populate[2]=cart_items.product_variation&populate[3]=cart_items.product_variation.product&populate[4]=cart_items.product_variation.product.CoverImage&populate[5]=user.user_info"
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
