"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { columns, MobileTable } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import ShippingTabs from "@/components/SuperAdmin/ShippingTabs";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";

export default function ShippingAreasPage() {
  useFreshDataOnPageLoad();
  return (
    <div className="flex flex-col gap-6">
      <ShippingTabs selectedTab="area" />

      <ContentWrapper
        title="لیست مناطق"
        hasAddButton
        addButtonText="افزودن منطقه جدید"
        hasFilterButton
        hasRecycleBin
      >
        <SuperAdminTable
          columns={columns}
          url="/shipping-areas"
          mobileTable={(data) => <MobileTable data={data} />}
        />
      </ContentWrapper>
    </div>
  );
}
