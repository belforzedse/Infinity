"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import SearchIcon from "./Icons/SearchIcon";
import Text from "../Kits/Text";
import ChevronDownIcon from "./Icons/ChevronDownIcon";

interface PLPDesktopSearchProps {
  className?: string;
}

const PLPDesktopSearch: React.FC<PLPDesktopSearchProps> = ({
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't search if query is empty
    if (!searchQuery.trim()) return;

    // Redirect to search results page with the query
    router.push(`/plp?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-[282px] flex items-center justify-between bg-stone-50 border border-slate-50 rounded-[28px] pr-5 pl-2 py-2 ${className}`}
    >
      <div className="flex items-center gap-1 text-sm w-full">
        <div className="flex items-center gap-1 text-neutral-600 cursor-pointer">
          <Text className="text-neutral-600">محصولات</Text>
          <ChevronDownIcon className="text-neutral-600" />
        </div>

        <div className="h-[17px] w-[1px] bg-zinc-200" />

        <div className="flex items-center justify-between w-full">
          <input
            type="text"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="دنبال چی میگردی؟"
            className="bg-transparent text-neutral-400 placeholder-neutral-400 outline-none text-right"
          />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex items-center justify-center bg-pink-500 rounded-[28px] w-[36px] h-[32px]"
            >
              <SearchIcon className="text-white w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PLPDesktopSearch;
