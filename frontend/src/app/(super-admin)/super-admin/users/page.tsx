"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { columns, MobileTable } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { ENDPOINTS } from "@/constants/api";
import { useState } from "react";

export default function UsersPage() {
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  return (
    <ContentWrapper
      title="کاربران"
      hasAddButton
      addButtonText="افزودن کاربر جدید"
      hasFilterButton
      hasRecycleBin
      hasPagination
      addButtonPath="/super-admin/users/add"
      apiUrl={ENDPOINTS.USER.GET_ALL}
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      filterOptions={[
        {
          id: "[user_info][FirstName]",
          title: "نام",
        },
        {
          id: "[user_info][LastName]",
          title: "نام خانوادگی",
        },
        {
          id: "[Phone]",
          title: "شماره تلفن",
        },
      ]}
    >
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? `${ENDPOINTS.USER.GET_ALL}?populate=*&filters[removedAt][$null]=false`
            : `${ENDPOINTS.USER.GET_ALL}?populate=*&filters[removedAt][$null]=true`
        }
        mobileTable={(data) => <MobileTable data={data} />}
      />
    </ContentWrapper>
  );
}
