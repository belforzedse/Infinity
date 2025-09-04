import SearchIcon from "@/components/Product/Icons/SearchIcon";
import Select from "@/components/Kits/Form/Select";
import React from "react";

export const FilterSection: React.FC = () => {
  return (
    <div className="my-4 flex items-center justify-between gap-4">
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

      <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 px-1 py-1.5">
        <SearchIcon className="h-5 w-5 text-neutral-600" />
        <input
          className="text-sm w-full border-none bg-transparent text-neutral-600 outline-none placeholder:text-neutral-400"
          placeholder="جستجو"
          type="text"
        />
      </div>
    </div>
  );
};
