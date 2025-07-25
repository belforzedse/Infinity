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
        className="w-full h-11 bg-neutral-100 border border-neutral-100 rounded-[20px] pr-12 pl-4 text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-200"
        dir="rtl"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <SearchIcon />
      </div>
    </div>
  );
}
