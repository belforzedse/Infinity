"use client";

import PLPButton from "@/components/Kits/PLP/Button";
import FilterIcon from "../Icons/FilterIcon";
import SortDescIcon from "../Icons/SortDescIcon";
import AvailabilityFilter from "./Filter/Availability";
import PLPListFilter from "./Filter";
import XIcon from "../Icons/XIcon";
import { useState } from "react";
import { useQueryState } from "nuqs";

interface MobileFilterProps {
  categories?: Array<{ id: string; title: string }>;
  isLoadingCategories?: boolean;
}

export default function PLPListMobileFilter({
  categories,
  isLoadingCategories = false,
}: MobileFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [available, setAvailable] = useQueryState("available");

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  const handleAvailabilityChange = (checked: boolean) => {
    setAvailable(checked ? "true" : null);
  };

  const handleApplyFilters = () => {
    handleClose();
  };

  return (
    <div className="flex gap-1">
      <PLPButton className="h-auto w-auto" text="نمایش فیلتر ها" rightIcon={<FilterIcon />} onClick={handleOpen} />

      {/* <PLPButton text="مرتب سازی" rightIcon={<SortDescIcon className="h-6 w-6" />} /> */}

      <AvailabilityFilter
        onChange={handleAvailabilityChange}
        defaultChecked={available === "true"}
      />

      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed right-0 top-0 z-20 h-[100vh] w-[100vw] bg-gray-500/50 transition-opacity duration-300 ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {/* Sidebar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`flex h-full w-[70vw] flex-col gap-[18px] overflow-y-auto bg-white px-4 pb-8 transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="sticky top-0 z-30 flex items-center justify-between bg-white pb-4 pt-8">
            <span className="text-lg">همه فیلتر‌ها</span>

            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200"
            >
              <XIcon />
            </button>
          </div>

          <PLPListFilter
            showAvailableOnly={available === "true"}
            categories={categories}
            isLoadingCategories={isLoadingCategories}
          />

          <PLPButton
            text="اعمال فیلتر ها"
            className="!text-base flex w-full items-center justify-center bg-pink-500 text-white"
            onClick={handleApplyFilters}
          />
        </div>
      </div>
    </div>
  );
}
