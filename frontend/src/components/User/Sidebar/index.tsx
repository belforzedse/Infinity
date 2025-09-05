"use client";
import SidebarItem from "./SidebarItem";
import { USER_SIDEBAR_ITEMS, LOGOUT_ITEM } from "@/components/User/Constnats";

const UserSidebar = () => {
  //   const handleLogout = () => {
  //     /* Add logout logic here */
  //   };

  return (
    <div className="mr-1 hidden w-[240px] flex-col gap-4 rounded-lg bg-white shadow-sm lg:flex">
      <span className="text-4xl mb-4 text-right text-foreground-primary">
        حساب من
      </span>

      <div className="flex flex-col gap-2 px-8">
        {USER_SIDEBAR_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            text={item.text}
          />
        ))}

        <SidebarItem
          href=""
          icon={LOGOUT_ITEM.icon}
          text={LOGOUT_ITEM.text}
          onClick={() => {}}
        />
      </div>
    </div>
  );
};

export default UserSidebar;
