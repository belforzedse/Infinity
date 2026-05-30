"use client";

import Image from "next/image";
import { StorefrontLogo } from "@repo/brand";
import MenuIcon from "@/components/PLP/Icons/MenuIcon";
import MobileBackButton from "@/components/MobileBackButton";
import { useMe } from "@/hooks/api/useMe";
import { useMobileStickyHeader } from "@/hooks/useMobileStickyHeader";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

interface SuperAdminLayoutHeaderProps {
  onMenuClick: () => void;
}

export default function SuperAdminLayoutHeader({ onMenuClick }: SuperAdminLayoutHeaderProps) {
  const { data: me, error } = useMe();
  const { showHeader } = useMobileStickyHeader({ breakpointPx: 768 });
  const userFacingError = error
    ? getUserFacingErrorMessage(error, "خطا در دریافت اطلاعات کاربر")
    : null;

  return (
    <>
      <header
        className={`fixed left-4 right-4 top-4 z-40 transform transition-all duration-200 md:hidden ${
          showHeader ? "translate-y-0" : "-translate-y-[calc(100%+1rem)]"
        }`}
      >
        <div
          className="relative flex min-h-[4.5rem] items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/35"
          dir="ltr"
        >
          <div className="relative z-10 flex w-28 items-center justify-start">
            <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 p-1 shadow-sm">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-100">
                <Image
                  src="https://img.icons8.com/ios/100/000000/user-male-circle.png"
                  alt="No photo"
                  width={40}
                  height={40}
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto">
              <StorefrontLogo href="/" width={92} height={58} />
            </div>
          </div>

          <div className="relative z-10 flex w-28 items-center justify-end gap-2">
            <MobileBackButton />
            <button
              onClick={onMenuClick}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-neutral-100"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>
      <div className="h-[4.5rem] md:hidden" aria-hidden />

      <header
        className="sticky top-4 z-40 hidden min-h-[4.5rem] w-full items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/35 md:flex lg:px-6"
        dir="ltr"
      >
        {/* Search Section */}
        <div className="relative z-10 order-3 hidden w-48 flex-shrink-0 lg:block">
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

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <StorefrontLogo href="/" width={92} height={58} />
          </div>
        </div>

        {/* User Profile Section */}
        <div className="relative z-10 order-1 flex min-w-0 flex-shrink-0 items-center justify-start gap-2 lg:w-64 lg:gap-4">
          <div className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/70 px-2 py-2 shadow-sm">
            <div className="flex cursor-pointer items-center gap-2 lg:gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-100">
                <Image
                  src="https://img.icons8.com/ios/100/000000/user-male-circle.png"
                  alt="No photo"
                  width={40}
                  height={40}
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="hidden min-w-0 flex-col gap-1 text-right lg:flex">
                <span className="text-sm !leading-none text-neutral-600">
                  {me?.FirstName} {me?.LastName}
                </span>
                <span className="text-xs !leading-none text-neutral-500">{me?.Phone}</span>
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
    </>
  );
}
