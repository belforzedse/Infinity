import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import HomeIcon from "./Icons/HomeIcon";
import CategoryIcon from "./Icons/CategoryIcon";
import BasketIcon from "./Icons/BasketIcon";
import ProfileIcon from "./Icons/ProfileIcon";
import CategoriesModal from "./CategoriesModal";

const PLPBottomNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    setIsAuthenticated(!!accessToken);
  }, []);

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push("/account");
    } else {
      router.push("/auth");
    }
  };

  const navItems = [
    {
      label: "خانه",
      href: "/",
      icon: (isActive: boolean) => <HomeIcon isActive={isActive} />,
    },
    {
      label: "دسته بندی ها",
      href: "#",
      icon: (isActive: boolean) => <CategoryIcon isActive={isActive} />,
      onClick: () => setIsCategoriesModalOpen(true),
    },
    {
      label: "سبد خرید",
      href: "/cart",
      icon: (isActive: boolean) => <BasketIcon isActive={isActive} />,
    },
    {
      label: "حساب کاربری",
      href: isAuthenticated ? "/account" : "/auth",
      icon: (isActive: boolean) => <ProfileIcon isActive={isActive} />,
      onClick: handleProfileClick,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 rounded-t-xl border-t border-fuchsia-50 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.onClick}
                className={`flex w-[74px] flex-col items-center gap-1 p-2 ${
                  isActive
                    ? "rounded-lg bg-pink-50 text-pink-600"
                    : "text-neutral-800"
                }`}
              >
                {item.icon(isActive)}
                <span className="text-xs font-normal">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
      />
    </>
  );
};

export default PLPBottomNavigation;
