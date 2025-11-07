"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import ShippingTabs from "@/components/SuperAdmin/ShippingTabs";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";

export default function ShippingProvincesPage() {
  useFreshDataOnPageLoad();
  return (
    <div className="flex flex-col gap-6">
      <ShippingTabs selectedTab="province" />

      <ContentWrapper
        title="لیست استان ها"
        hasFilterButton
        hasPagination
        filterOptions={[
          {
            id: "[Title]",
            title: "عنوان",
          },
        ]}
      >
        <SuperAdminTable
          _removeActions
          columns={columns}
          url="/shipping-provinces"
          mobileTable={(data) => <MobileTable data={data} />}
        />
      </ContentWrapper>
    </div>
  );
}
