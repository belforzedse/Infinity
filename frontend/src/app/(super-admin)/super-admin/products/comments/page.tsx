"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useState } from "react";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";

export default function ProductsCommentsPage() {
  useFreshDataOnPageLoad();
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

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
