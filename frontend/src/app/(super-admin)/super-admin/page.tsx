"use client";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useMe } from "@/hooks/api/useMe";

export default function SuperAdminPage() {
  const { data: me, isLoading, error } = useMe();

  const name = `${me?.FirstName || ""} ${me?.LastName || ""}`;

  return (
    <ContentWrapper title={`سلام ${name.trim() || "همکار گرامی"}`}>
      {error && (
        <p className="text-sm text-red-500" dir="rtl">
          {error.message}
        </p>
      )}
      {isLoading && !error && (
        <p className="text-sm text-neutral-500">در حال بارگذاری...</p>
      )}
    </ContentWrapper>
  );
}
