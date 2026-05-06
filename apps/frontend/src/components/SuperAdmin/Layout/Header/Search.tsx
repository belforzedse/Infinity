"use client";
import { useState } from "react";
import SearchIcon from "../Icons/SearchIcon";

export default function SuperAdminLayoutHeaderSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="جستجو"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-11 w-full rounded-[20px] border border-neutral-100 bg-neutral-100 pl-4 pr-12 text-neutral-900 placeholder:text-neutral-600 focus:border-neutral-200 focus:outline-none"
        dir="rtl"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <SearchIcon />
      </div>
    </div>
  );
}
