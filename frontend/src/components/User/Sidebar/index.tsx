"use client";
import SidebarItem from "./SidebarItem";
import { USER_SIDEBAR_ITEMS, LOGOUT_ITEM } from "@/components/User/Constnats";

const UserSidebar = () => {
  //   const handleLogout = () => {
  //     console.log("click");
  //     /* Add logout logic here */
  //   };

  return (
    <div className="w-[240px] bg-white lg:flex hidden flex-col gap-4 rounded-lg shadow-sm mr-1">
      <span className="text-4xl text-foreground-primary mb-4 text-right">
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
