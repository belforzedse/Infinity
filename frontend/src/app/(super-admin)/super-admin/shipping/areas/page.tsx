"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { Area, columns, MobileTable } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import ShippingTabs from "@/components/SuperAdmin/ShippingTabs";

// This is sample data. Replace with your actual data fetching logic
const data: Area[] = [
  {
    id: "1",
    title: "منطقه ۱",
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15"),
    description: "شمال تهران",
  },
  {
    id: "2",
    title: "منطقه ۲",
    createdAt: new Date("2024-03-14"),
    updatedAt: new Date("2024-03-14"),
    description: "غرب تهران",
  },
];

export default function ShippingAreasPage() {
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
        <SuperAdminTable columns={columns} data={data} />

        <div className="block md:hidden">
          <MobileTable data={data} />
        </div>
      </ContentWrapper>
    </div>
  );
}
