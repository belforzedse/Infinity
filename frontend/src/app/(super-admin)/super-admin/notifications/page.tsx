"use client";

import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import type { Notification} from "./table";
import { MobileTable, columns } from "./table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";

// This is sample data. Replace with your actual data fetching logic
const data: Notification[] = [
  {
    id: "1",
    title: "بروزرسانی سیستم",
    type: "سیستمی",
    createdAt: new Date("2023-10-02"),
    updatedAt: new Date("2023-10-02"),
  },
  {
    id: "2",
    title: "تغییر قوانین",
    type: "اطلاع رسانی",
    createdAt: new Date("2023-09-16"),
    updatedAt: new Date("2023-09-16"),
  },
  {
    id: "3",
    title: "پیشنهاد ویژه",
    type: "تبلیغاتی",
    createdAt: new Date("2023-09-23"),
    updatedAt: new Date("2023-09-25"),
  },
];

export default function Page() {
  return (
    <ContentWrapper
      title="نوتیفیکیشن ها"
      hasRecycleBin
      hasFilterButton
      hasPagination
      hasAddButton
      addButtonText="ثبت اعلان جدید"
      addButtonPath="/super-admin/notifications/add"
    >
      <SuperAdminTable columns={columns} data={data} />

      <div className="block md:hidden">
        <MobileTable data={data} />
      </div>
    </ContentWrapper>
  );
}
