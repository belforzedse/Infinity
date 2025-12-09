"use client";

import { useMemo } from "react";
import { Select, type Option } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Props {
  options: Array<{ id: string | number; title: string }>;
  className?: string;
  buttonClassName?: string;
  selectedOption?: string | number;
  iconClassName?: string;
  onOptionSelect?: (optionId: string | number) => void;
}

/**
 * Super Admin wrapper around the design-system Select.
 * Keeps existing API (`title` field) while rendering the shared UI component.
 */
const SuperAdminTableSelect = ({
  options,
  onOptionSelect,
  className,
  buttonClassName,
  selectedOption: selectedOptionId,
}: Props) => {
  const selectOptions: Option[] = useMemo(() => {
    const normalizeId = (id: string | number) => {
      const str = String(id ?? "");
      return str.length === 0 ? "__empty" : str;
    };
    return options.map((opt) => ({
      id: normalizeId(opt.id),
      name: opt.title,
    }));
  }, [options]);

  const valueToOriginal = useMemo(() => {
    const normalizeId = (id: string | number) => {
      const str = String(id ?? "");
      return str.length === 0 ? "__empty" : str;
    };
    return options.reduce<Record<string, string | number>>((acc, opt) => {
      acc[normalizeId(opt.id)] = opt.id;
      return acc;
    }, {});
  }, [options]);

  const selected = useMemo(() => {
    const normalizeId = (id: string | number | undefined) => {
      const str = String(id ?? "");
      return str.length === 0 ? "__empty" : str;
    };
    return selectOptions.find((opt) => opt.id === normalizeId(selectedOptionId)) || null;
  }, [selectOptions, selectedOptionId]);

  return (
    <div className={cn("min-w-[180px]", className)}>
      <Select
        value={selected}
        onChange={(opt) => {
          const originalId = valueToOriginal[String(opt.id)];
          onOptionSelect?.(originalId ?? opt.id);
        }}
        options={selectOptions}
        selectButtonClassName={buttonClassName}
        placeholder="انتخاب کنید"
      />
    </div>
  );
};

export default SuperAdminTableSelect;
