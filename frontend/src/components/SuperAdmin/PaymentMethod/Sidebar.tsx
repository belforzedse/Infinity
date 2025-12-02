"use client";
import { useState } from "react";
import ActiveBox from "../UpsertPage/ContentWrapper/ActiveBox";

export default function SuperAdminPaymentMethodSidebar() {
  const [isActive, setIsActive] = useState(true);

  return (
    <div className="flex flex-col gap-3 md:sticky md:top-5">
      <ActiveBox
        title="حالت تست"
        label="تستی بودن درگاه"
        status={isActive}
        onChange={() => setIsActive(!isActive)}
      />
    </div>
  );
}
