"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import { ENDPOINTS } from "@/constants/api";
import { useState } from "react";

export default function TagsPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  return (
    <ContentWrapper
      title="برچسب‌ها"
      hasFilterButton
      hasPagination
      hasRecycleBin
      apiUrl={ENDPOINTS.PRODUCT.TAG}
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      filterOptions={[{ id: "[Title]", title: "نام" }]}
    >
      <SuperAdminTable
        removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? `${ENDPOINTS.PRODUCT.TAG}?filters[removedAt][$null]=false`
            : `${ENDPOINTS.PRODUCT.TAG}?filters[removedAt][$null]=true`
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}

