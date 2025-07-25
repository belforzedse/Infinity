"use client";

import { useState } from "react";
import Image from "next/image";
import Logo from "@/components/Kits/Logo";
import MenuIcon from "@/components/PLP/Icons/MenuIcon";
import SearchIcon from "../Icons/SearchIcon";
import SmallChevronDownIcon from "../Icons/SmallChevronDownIcon";
import { useMe } from "@/hooks/api/useMe";

interface SuperAdminLayoutHeaderProps {
  onMenuClick: () => void;
}

export default function SuperAdminLayoutHeader({
  onMenuClick,
}: SuperAdminLayoutHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const me = useMe();

  return (
    <header className="w-full lg:h-[76px] h-fit rounded-2xl lg:bg-white flex items-center justify-between lg:px-6 border-b border-neutral-100">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-10 h-10 border border-slate-200 hover:bg-neutral-100 rounded-full"
      >
        <MenuIcon />
      </button>

      <div className="md:hidden">
        <Logo />
      </div>

      {/* Search Section */}
      <div className="flex-1 max-w-[400px] lg:block hidden">
        {/* <div className="relative">
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
        </div> */}
      </div>

      {/* User Profile Section */}
      <div className="flex items-center lg:gap-6 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center lg:gap-4 gap-1 cursor-pointer">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-100 relative">
              <Image
                src="/images/super-admin.png"
                alt="User Avatar"
                fill
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:flex flex-col gap-1 hidden">
              <span className="text-neutral-600 text-sm !leading-none">
                {me?.data?.FirstName} {me?.data?.LastName}
              </span>
              <span className="text-neutral-600 text-xs !leading-none">
                {me?.data?.Phone}
              </span>
            </div>
            {/* <div className="w-[18px] h-[18px] border border-neutral-600 rounded-full flex justify-center items-center">
              <SmallChevronDownIcon />
            </div> */}
          </div>
        </div>

        {/* <Image
          className="cursor-pointer"
          src="/images/super-admin-notification.png"
          alt="Notification"
          width={30}
          height={30}
        /> */}
      </div>
    </header>
  );
}
