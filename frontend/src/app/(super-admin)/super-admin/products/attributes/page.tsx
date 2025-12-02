"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns, type Attribute } from "./table";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";

// Temporary in-memory data until API is available
const demoData: Attribute[] = [];

export default function AttributesPage() {
  useFreshDataOnPageLoad();
  return (
    <ContentWrapper title="ویژگی‌ها" hasFilterButton hasPagination>
      <SuperAdminTable columns={columns} data={demoData} />
      <div className="mt-4 block md:hidden">
        <MobileTable data={demoData} />
      </div>
    </ContentWrapper>
  );
}
