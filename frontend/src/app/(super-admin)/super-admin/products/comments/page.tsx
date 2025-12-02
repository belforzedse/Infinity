"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ProductsCommentsPage() {
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
      title="دیدگاه ها"
      hasRecycleBin
      hasFilterButton
      hasPagination
      filterOptions={[
        { id: "[Rate]", title: "امتیاز" },
        { id: "[Content]", title: "محتوا" },
        { id: "[LikeCounts]", title: "تعداد لایک" },
        { id: "[DislikeCounts]", title: "تعداد دیسلایک" },
        { id: "[user][Phone]", title: "شماره تلفن" },
      ]}
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      apiUrl={"/product-reviews"}
    >
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? "/product-reviews?populate[0]=user&filters[removedAt][$null]=false"
            : "/product-reviews?populate[0]=user&filters[removedAt][$null]=true"
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
