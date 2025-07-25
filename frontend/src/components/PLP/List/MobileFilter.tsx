"use client";

import PLPButton from "@/components/Kits/PLP/Button";
import FilterIcon from "../Icons/FilterIcon";
import SortDescIcon from "../Icons/SortDescIcon";
import AvailabilityFilter from "./Filter/Availability";
import PLPListFilter from "./Filter";
import XIcon from "../Icons/XIcon";
import { useState } from "react";
import { useQueryState } from "nuqs";

export default function PLPListMobileFilter() {
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
      <PLPButton
        text="نمایش فیلتر ها"
        rightIcon={<FilterIcon />}
        onClick={handleOpen}
      />

      <PLPButton
        text="مرتب سازی"
        rightIcon={<SortDescIcon className="w-6 h-6" />}
      />

      <AvailabilityFilter
        onChange={handleAvailabilityChange}
        defaultChecked={available === "true"}
      />

      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`w-[100vw] h-[100vh] fixed top-0 right-0 bg-gray-500/50 z-20 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Sidebar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-[70vw] bg-white h-full flex flex-col gap-[18px] pb-8 px-4 overflow-y-auto transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between sticky top-0 bg-white pt-8 pb-4 z-30">
            <span className="text-lg">همه فیلتر‌ها</span>

            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-full"
            >
              <XIcon />
            </button>
          </div>

          <PLPListFilter showAvailableOnly={available === "true"} />

          <PLPButton
            text="اعمال فیلتر ها"
            className="w-full bg-pink-500 text-white flex items-center justify-center !text-base"
            onClick={handleApplyFilters}
          />
        </div>
      </div>
    </div>
  );
}
