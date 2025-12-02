"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import { ENDPOINTS } from "@/constants/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function TagsPage() {
  useFreshDataOnPageLoad();
  const router = useRouter();
  const { roleName } = useCurrentUser();
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  // Redirect editors away from product pages
  useEffect(() => {
    const normalizedRole = (roleName ?? "").toLowerCase().trim();
    if (normalizedRole === "editor") {
      router.replace("/super-admin/blog");
    }
  }, [roleName, router]);

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
        _removeActions
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
