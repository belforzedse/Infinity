"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, getCategoryColumns } from "./table";
import { ENDPOINTS } from "@/constants/api";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useEffect, useMemo, useCallback, useState } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CategoriesPage() {
  useFreshDataOnPageLoad();
  const router = useRouter();
  const { roleName } = useCurrentUser();
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());

  // Redirect editors away from product pages
  useEffect(() => {
    const normalizedRole = (roleName ?? "").toLowerCase().trim();
    if (normalizedRole === "editor") {
      router.replace("/super-admin/blog");
    }
  }, [roleName, router]);

  const toggleParentExpansion = useCallback((id: string) => {
    setExpandedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns = useMemo(
    () =>
      getCategoryColumns({
        expandedParentIds,
        toggleParentExpansion,
      }),
    [expandedParentIds, toggleParentExpansion],
  );
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
        url={`${ENDPOINTS.PRODUCT.CATEGORY}?populate[children]=*&filters[parent][id][$null]=true`}
        mobileTable={(data) => (
          <MobileTable
            data={data}
            expandedParentIds={expandedParentIds}
            toggleParentExpansion={toggleParentExpansion}
          />
        )}
      />
    </ContentWrapper>
  );
}
