"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useState } from "react";

export default function CouponsPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  return (
    <ContentWrapper
      title="کد تخفیف"
      hasAddButton
      addButtonPath="/super-admin/coupons/add"
      addButtonText="کد تخفیف جدید"
      hasFilterButton
      hasRecycleBin
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      apiUrl={"/discounts"}
      hasPagination
    >
      <SuperAdminTable
        removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? "/discounts?filters[removedAt][$null]=false"
            : "/discounts?filters[removedAt][$null]=true"
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
