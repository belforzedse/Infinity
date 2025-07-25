"use client";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { useMe } from "@/hooks/api/useMe";

export default function SuperAdminPage() {
  const { data: me } = useMe();

  const name = `${me?.FirstName || ""} ${me?.LastName || ""}`;

  return (
    <ContentWrapper title={`سلام ${name.trim() || "همکار گرامی"}`}>
      .
    </ContentWrapper>
  );
}
