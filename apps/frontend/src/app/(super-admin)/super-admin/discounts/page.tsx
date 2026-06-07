"use client";

import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import Link from "next/link";

export default function DiscountsPage() {
  return (
    <ContentWrapper title="مدیریت تخفیف ها">
      <div className="flex flex-col gap-4">
        <Link href="/super-admin/coupons" className="text-infinity-primary">
          کدهای تخفیف
        </Link>
        <Link href="/super-admin/general-discounts" className="text-infinity-primary">
          تخفیفای عمومی
        </Link>
      </div>
    </ContentWrapper>
  );
}
