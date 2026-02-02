"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, getCategoryColumns } from "./table";
import { ENDPOINTS } from "@/constants/api";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CategoriesPage() {
  useFreshDataOnPageLoad();
  const router = useRouter();
  const { roleName } = useCurrentUser();
  // Redirect editors away from product pages
  useEffect(() => {
    const normalizedRole = (roleName ?? "").toLowerCase().trim();
    if (normalizedRole === "editor") {
      router.replace("/super-admin/blog");
    }
  }, [roleName, router]);

  const columns = useMemo(() => getCategoryColumns(), []);
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
        className="w-full [&_thead]:hidden [&_tbody]:grid [&_tbody]:grid-cols-1 sm:[&_tbody]:grid-cols-2 lg:[&_tbody]:grid-cols-3 [&_tbody]:gap-5 [&_tbody_tr]:border-0 [&_tbody_tr]:bg-transparent [&_tbody_tr]:hover:bg-transparent [&_tbody_tr]:shadow-none [&_tbody_tr_td]:p-0"
        url={`${ENDPOINTS.PRODUCT.CATEGORY}?populate[children]=*&populate[Image]=*&filters[parent][id][$null]=true`}
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
