"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useState } from "react";

export default function CouponsRulesPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  return (
    <ContentWrapper
      title="قوانین تخفیف"
      hasAddButton
      addButtonText="قانون جدید"
      addButtonPath="/super-admin/coupons/rules/add"
      hasFilterButton
      hasRecycleBin
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      apiUrl={"/general-discounts"}
      hasPagination
    >
      <SuperAdminTable
        removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? "/general-discounts?filters[removedAt][$null]=false"
            : "/general-discounts?filters[removedAt][$null]=true"
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
