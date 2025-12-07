"use client";

import Image from "next/image";
import Logo from "@/components/Kits/SuperAdminLogo";
import MenuIcon from "@/components/PLP/Icons/MenuIcon";
import { useMe } from "@/hooks/api/useMe";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

interface SuperAdminLayoutHeaderProps {
  onMenuClick: () => void;
}

export default function SuperAdminLayoutHeader({ onMenuClick }: SuperAdminLayoutHeaderProps) {
  const { data: me, error } = useMe();
  const userFacingError = error ? getUserFacingErrorMessage(error, "خطا در دریافت اطلاعات کاربر") : null;

  return (
    <header className="flex h-fit w-full items-center justify-between rounded-2xl border-b border-neutral-100 md:h-[60px] lg:h-[76px] md:bg-white md:px-4 lg:px-6">
      {/* Mobile Menu Button - only show on mobile, not tablets */}
      <button
        onClick={onMenuClick}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 hover:bg-neutral-100 md:hidden"
      >
        <MenuIcon />
      </button>

      <div className="md:hidden">
        <Logo />
      </div>

      {/* Search Section */}
      <div className="hidden max-w-[400px] flex-1 lg:block">
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
      <div className="flex items-center gap-2 lg:gap-6">
        <div className="flex items-center gap-4">
          <div className="flex cursor-pointer items-center gap-1 lg:gap-4">
            <div className="h-9 w-9 overflow-hidden rounded-full bg-neutral-100">
              <Image
                src="https://img.icons8.com/ios/100/000000/user-male-circle.png"
                alt="No photo"
                width={36}
                height={36}
                className="object-cover"
                unoptimized
                loader={({ src }) => src}
              />
            </div>
            <div className="hidden flex-col gap-1 lg:flex">
              <span className="text-sm !leading-none text-neutral-600">
                {me?.FirstName} {me?.LastName}
              </span>
              <span className="text-xs !leading-none text-neutral-600">{me?.Phone}</span>
            </div>
            {/* <div className="w-[18px] h-[18px] border border-neutral-600 rounded-full flex justify-center items-center">
              <SmallChevronDownIcon />
            </div> */}
          </div>
        </div>
        {userFacingError && (
          <span className="text-xs text-red-500" dir="rtl">
            {userFacingError}
          </span>
        )}

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
