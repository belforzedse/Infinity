"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import type { PaymentMethods} from "./table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useFreshDataOnPageLoad } from "@/hooks/useFreshDataOnPageLoad";

// This is sample data. Replace with your actual data fetching logic
const data: PaymentMethods[] = [
  {
    id: "1",
    title: "درگاه پرداخت زرین پال",
    createdAt: "1402/12/25",
    updatedAt: "1402/12/25",
    roleLevel: "ادمین",
    apiKey: "zp_test_1234567890",
    status: "active",
  },
  {
    id: "2",
    title: "درگاه پرداخت پی‌پینگ",
    createdAt: "1402/12/24",
    updatedAt: "1402/12/24",
    roleLevel: "کاربر",
    apiKey: "pp_test_0987654321",
    status: "inactive",
  },
];

export default function PaymentMethodsPage() {
  useFreshDataOnPageLoad();
  return (
    <ContentWrapper
      title="درگاه های پرداخت"
      hasAddButton
      addButtonText="ثبت درگاه جدید"
      addButtonPath="/super-admin/payment-methods/add"
      hasFilterButton
      hasRecycleBin
    >
      <SuperAdminTable columns={columns} data={data} draggable />

      <div className="block md:hidden">
        <MobileTable data={data} />
      </div>
    </ContentWrapper>
  );
}
