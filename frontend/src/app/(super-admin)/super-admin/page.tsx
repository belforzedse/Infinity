"use client";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useMe } from "@/hooks/api/useMe";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export default function SuperAdminPage() {
  const { data: me, isLoading, error } = useMe();

  const name = `${me?.FirstName || ""} ${me?.LastName || ""}`;
  const userFacingError = error
    ? getUserFacingErrorMessage(error, "خطا در دریافت اطلاعات کاربری")
    : null;

  return (
    <ContentWrapper title={`سلام ${name.trim() || "همکار گرامی"}`}>
      {userFacingError && (
        <p className="text-sm text-red-500" dir="rtl">
          {userFacingError}
        </p>
      )}
      {isLoading && !error && <p className="text-sm text-neutral-500">در حال بارگذاری...</p>}
    </ContentWrapper>
  );
}
