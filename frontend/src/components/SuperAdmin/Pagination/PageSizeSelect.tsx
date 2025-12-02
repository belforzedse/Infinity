"use client";

import SuperAdminTableSelect from "../Table/Select";
import usePageSizeQuery, { PAGE_SIZE_OPTIONS } from "@/hooks/usePageSizeQuery";

interface PageSizeSelectProps {
  className?: string;
}

export default function SuperAdminPageSizeSelect({ className }: PageSizeSelectProps) {
  const { pageSize, updatePageSize } = usePageSizeQuery();

  return (
    <SuperAdminTableSelect
      className={className}
      options={PAGE_SIZE_OPTIONS}
      selectedOption={pageSize}
      onOptionSelect={(optionId) => updatePageSize(optionId as number)}
    />
  );
}
