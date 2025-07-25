"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useState } from "react";

export default function ProductsPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  return (
    <ContentWrapper
      title="محصولات"
      hasAddButton
      addButtonText="محصول جدید"
      hasFilterButton
      hasPagination
      addButtonPath="/super-admin/products/add"
      hasRecycleBin
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      apiUrl={"/products"}
    >
      <SuperAdminTable
        columns={columns}
        url={
          isRecycleBinOpen
            ? "/products?populate[0]=CoverImage&populate[1]=product_variations&populate[2]=product_variations.product_stock&populate[3]=product_main_category&filters[removedAt][$null]=false"
            : "/products?populate[0]=CoverImage&populate[1]=product_variations&populate[2]=product_variations.product_stock&populate[3]=product_main_category&filters[removedAt][$null]=true"
        }
        mobileTable={(data) => <MobileTable data={data} />}
        removeActions
      />
    </ContentWrapper>
  );
}
