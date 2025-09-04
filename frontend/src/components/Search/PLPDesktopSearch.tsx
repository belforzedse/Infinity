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
      className={`flex w-[282px] items-center justify-between rounded-[28px] border border-slate-50 bg-stone-50 py-2 pl-2 pr-5 ${className}`}
    >
      <div className="text-sm flex w-full items-center gap-1">
        <div className="flex cursor-pointer items-center gap-1 text-neutral-600">
          <Text className="text-neutral-600">محصولات</Text>
          <ChevronDownIcon className="text-neutral-600" />
        </div>

        <div className="h-[17px] w-[1px] bg-zinc-200" />

        <div className="flex w-full items-center justify-between">
          <input
            type="text"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="دنبال چی میگردی؟"
            className="bg-transparent text-right text-neutral-400 placeholder-neutral-400 outline-none"
          />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex h-[32px] w-[36px] items-center justify-center rounded-[28px] bg-pink-500"
            >
              <SearchIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PLPDesktopSearch;
