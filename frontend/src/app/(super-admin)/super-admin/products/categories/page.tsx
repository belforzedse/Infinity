"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import { ENDPOINTS } from "@/constants/api";
import { useState } from "react";

export default function CategoriesPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  return (
    <ContentWrapper
      title="دسته‌بندی‌ها"
      hasFilterButton
      hasPagination
      hasRecycleBin
      apiUrl={ENDPOINTS.PRODUCT.CATEGORY}
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      filterOptions={[
        { id: "[Title]", title: "نام" },
        { id: "[Slug]", title: "نامک" },
      ]}
    >
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? `${ENDPOINTS.PRODUCT.CATEGORY}?populate=*&filters[removedAt][$null]=false`
            : `${ENDPOINTS.PRODUCT.CATEGORY}?populate=*&filters[removedAt][$null]=true`
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
