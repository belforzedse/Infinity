"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import ShippingTabs from "@/components/SuperAdmin/ShippingTabs";
import { useState } from "react";

export default function ShippingPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <ShippingTabs selectedTab="shipping" />

      <ContentWrapper
        title="روش های حمل و نقل"
        hasRecycleBin
        isRecycleBinOpen={isRecycleBinOpen}
        setIsRecycleBinOpen={setIsRecycleBinOpen}
        apiUrl="/shippings"
        filterOptions={[
          {
            id: "[Title]",
            title: "عنوان",
          },
          {
            id: "[Price]",
            title: "هزینه",
          },
        ]}
      >
        <SuperAdminTable
          columns={columns}
          removeActions
          url={
            isRecycleBinOpen
              ? "/shippings?filters[removedAt][$null]=false"
              : "/shippings?filters[removedAt][$null]=true"
          }
          mobileTable={(data) => <MobileTable data={data} />}
        />
      </ContentWrapper>
    </div>
  );
}
