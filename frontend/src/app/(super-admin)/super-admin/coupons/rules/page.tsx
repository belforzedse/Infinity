"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import { MobileTable, createColumns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useMemo, useState } from "react";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function CouponsRulesPage() {
  useFreshDataOnPageLoad();
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const { isStoreManager } = useCurrentUser();
  const canManageDiscounts = !isStoreManager;
  const columns = useMemo(() => createColumns(canManageDiscounts), [canManageDiscounts]);

  return (
    <ContentWrapper
      title="قوانین تخفیف"
      hasAddButton={canManageDiscounts}
      addButtonText={canManageDiscounts ? "قانون جدید" : undefined}
      addButtonPath={canManageDiscounts ? "/super-admin/coupons/rules/add" : undefined}
      hasFilterButton
      hasRecycleBin
      isRecycleBinOpen={isRecycleBinOpen}
      setIsRecycleBinOpen={setIsRecycleBinOpen}
      apiUrl={"/general-discounts"}
      hasPagination
    >
      <SuperAdminTable
        _removeActions
        columns={columns}
        url={
          isRecycleBinOpen
            ? "/general-discounts?filters[removedAt][$null]=false"
            : "/general-discounts?filters[removedAt][$null]=true"
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
