"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, createColumns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useMemo, useState } from "react";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CouponsPage() {
  useFreshDataOnPageLoad();
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const { isStoreManager } = useCurrentUser();
  const canManageDiscounts = !isStoreManager;
  const columns = useMemo(() => createColumns(canManageDiscounts), [canManageDiscounts]);

  return (
    <ContentWrapper
      title="کد تخفیف"
      hasAddButton={canManageDiscounts}
      addButtonPath={canManageDiscounts ? "/super-admin/coupons/add" : undefined}
      addButtonText={canManageDiscounts ? "کد تخفیف جدید" : undefined}
      hasFilterButton
      hasRecycleBin
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      apiUrl={"/discounts"}
      hasPagination
    >
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? "/discounts?populate[products]=*&populate[delivery_methods]=*&filters[removedAt][$null]=false"
            : "/discounts?populate[products]=*&populate[delivery_methods]=*&filters[removedAt][$null]=true"
        }
        mobileTable={(data) => (
          <MobileTable
            data={data}
            canManageDiscounts={canManageDiscounts}
            columns={columns}
          />
        )}
      />
    </ContentWrapper>
  );
}
