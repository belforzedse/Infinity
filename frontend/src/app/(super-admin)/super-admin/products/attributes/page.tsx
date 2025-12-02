"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns, type Attribute } from "./table";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Temporary in-memory data until API is available
const demoData: Attribute[] = [];

export default function AttributesPage() {
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

  return (
    <ContentWrapper title="ویژگی‌ها" hasFilterButton hasPagination>
      <SuperAdminTable columns={columns} data={demoData} />
      <div className="mt-4 block md:hidden">
        <MobileTable data={demoData} />
      </div>
    </ContentWrapper>
  );
}
