"use client";
import SidebarItem from "./SidebarItem";
import { USER_SIDEBAR_ITEMS, LOGOUT_ITEM } from "@/components/User/Constnats";
import { useState } from "react";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";
import { performLogout } from "@/utils/logout";

const UserSidebar = () => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    performLogout();
  };

  // const confirmAndLogout = () => {
  //   if (typeof window === "undefined") return;
  //   const confirmed = window.confirm(
  //     "آیا از خروج از حساب کاربری خود مطمئن هستید؟",
  //   );
  //   if (confirmed) handleLogout();
  // };

  const openConfirm = () => setShowConfirm(true);
  const closeConfirm = () => setShowConfirm(false);

  return (
    <div className="hidden w-full flex-col rounded-3xl p-5 lg:flex">
      <span className="mb-5 text-right text-4xl font-medium leading-none text-slate-800">حساب من</span>

      <div className="flex flex-1 flex-col gap-3">
        {USER_SIDEBAR_ITEMS.map((item) => (
          <SidebarItem key={item.href} href={item.href} icon={item.icon} text={item.text} />
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <SidebarItem
          href=""
          icon={LOGOUT_ITEM.icon}
          text={LOGOUT_ITEM.text}
          onClick={openConfirm}
          tone="logout"
        />
      </div>
      <ConfirmDialog
        isOpen={showConfirm}
        title="خروج از حساب کاربری"
        description="آیا از خروج از حساب کاربری خود مطمئن هستید؟"
        confirmText="بله، خارج شو"
        cancelText="انصراف"
        onConfirm={handleLogout}
        onCancel={closeConfirm}
      />
    </div>
  );
};

export default UserSidebar;
