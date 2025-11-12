"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import { ENDPOINTS } from "@/constants/api";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useEffect } from "react";
import { useQueryState } from "nuqs";

export default function CategoriesPage() {
  useFreshDataOnPageLoad();
  const [filterValue, setFilter] = useQueryState("filter", {
    defaultValue: [],
    parse: (value) => JSON.parse(decodeURIComponent(value || "[]")),
    serialize: (value) => encodeURIComponent(JSON.stringify(value || [])),
  });

  useEffect(() => {
    if (Array.isArray(filterValue) && filterValue.length === 0) return;
    setFilter([]);
  }, [filterValue, setFilter]);

  return (
    <ContentWrapper
      title="دسته‌بندی‌ها"
      hasFilterButton
      hasPagination
      hasAddButton
      addButtonText="افزودن دسته‌بندی"
      addButtonPath="/super-admin/products/categories/add"
      filterOptions={[
        { id: "[Title]", title: "نام" },
        { id: "[Slug]", title: "نامک" },
      ]}
    >
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={`${ENDPOINTS.PRODUCT.CATEGORY}?populate=*`}
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
