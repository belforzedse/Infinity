"use client";
import SidebarItem from "./SidebarItem";
import { USER_SIDEBAR_ITEMS, LOGOUT_ITEM } from "@/components/User/Constnats";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";

const UserSidebar = () => {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
    } finally {
      router.replace("/auth");
    }
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
    <div className="mr-1 hidden w-[240px] flex-col gap-4 rounded-lg bg-white shadow-sm lg:flex">
      <span className="text-4xl mb-4 text-right text-foreground-primary">حساب من</span>

      <div className="flex flex-col gap-2 px-8">
        {USER_SIDEBAR_ITEMS.map((item) => (
          <SidebarItem key={item.href} href={item.href} icon={item.icon} text={item.text} />
        ))}

        <SidebarItem
          href=""
          icon={LOGOUT_ITEM.icon}
          text={LOGOUT_ITEM.text}
          onClick={openConfirm}
        />
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
    </div>
  );
};

export default UserSidebar;
