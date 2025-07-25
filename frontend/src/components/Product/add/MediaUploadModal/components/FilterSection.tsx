import SearchIcon from "@/components/Product/Icons/SearchIcon";
import Select from "@/components/Kits/Form/Select";
import React from "react";

export const FilterSection: React.FC = () => {
  return (
    <div className="flex items-center justify-between gap-4 my-4">
      <div className="flex gap-2">
        <Select
          options={[
            { id: 1, name: "شلوار" },
            { id: 2, name: "جین" },
            { id: 3, name: "رسمی" },
            { id: 4, name: "کژوال" },
          ]}
          onChange={() => {}}
          value={{ id: 1, name: "شلوار" }}
          className="min-w-28 !rounded-lg"
          selectButtonClassName="!py-1 !px-3"
        />

        <Select
          options={[
            { id: 1, name: "همه تاریخ‌ها" },
            { id: 2, name: "امروز" },
            { id: 3, name: "این هفته" },
            { id: 4, name: "این ماه" },
          ]}
          onChange={() => {}}
          value={{ id: 1, name: "همه تاریخ‌ها" }}
          className="min-w-36 !rounded-lg"
          selectButtonClassName="!py-1 !px-3"
        />

        <Select
          options={[
            { id: 1, name: "تصاویر" },
            { id: 2, name: "عکس ها" },
            { id: 3, name: "ویدیوها" },
          ]}
          onChange={() => {}}
          value={{ id: 1, name: "تصاویر" }}
          className="min-w-28 !rounded-lg"
          selectButtonClassName="!py-1 !px-3"
        />
      </div>

      <div className="flex items-center bg-neutral-100 rounded-lg px-1 py-1.5 gap-0.5">
        <SearchIcon className="text-neutral-600 w-5 h-5" />
        <input
          className="w-full bg-transparent border-none outline-none text-sm text-neutral-600 placeholder:text-neutral-400"
          placeholder="جستجو"
          type="text"
        />
      </div>
    </div>
  );
};
