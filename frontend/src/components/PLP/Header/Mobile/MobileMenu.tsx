"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";
import XIcon from "@/components/User/Icons/XIcon";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/api/useNavigation";
import HomeIcon from "@/components/PLP/Icons/HomeIcon";
import SidebarItem from "@/components/User/Sidebar/SidebarItem";
import SearchIcon from "@/components/PLP/Icons/SearchIcon";
import { useDrag } from "@use-gesture/react";
import { hapticButton } from "@/utils/haptics";
import React from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSearchClick?: () => void;
}

interface MenuItem {
  label: string;
  href: string;
}

export default function MobileMenu({ isOpen, onClose, onSearchClick }: Props) {
  const pathname = usePathname();
  // Only trigger the API fetch when the menu is open
  const { navigation, loading } = useNavigation(isOpen);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Swipe-to-close gesture for mobile
  const bind = useDrag(
    ({ active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
      if (!panelRef.current || typeof window === "undefined" || window.innerWidth >= 1024) return;

      // Only handle right swipe (RTL: swipe right to close)
      const baseThreshold = 90;
      const fastSwipeThreshold = 45;
      const velocityThreshold = 0.5;
      const swipeThreshold = Math.abs(vx) > velocityThreshold ? fastSwipeThreshold : baseThreshold;

      if (!active && (mx > swipeThreshold || (xDir > 0 && Math.abs(vx) > velocityThreshold))) {
        hapticButton();
        onClose();
      }
    },
    {
      axis: "x",
      threshold: 10,
      preventDefault: true,
    },
  );

  // Transform navigation items to MenuItem format
  const menuItems: MenuItem[] = [
    { label: "خانه", href: "/" },
    ...navigation.map((item) => ({
      label: item.title,
      href: `/plp?category=${item.slug}`,
    })),
  ];

  // Lock body scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1200]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel
                ref={panelRef}
                className="h-fit w-[216px] transform overflow-hidden rounded-bl-xl bg-white shadow-xl transition-all"
                style={{
                  paddingTop: "max(1.25rem, calc(1.25rem + env(safe-area-inset-top) * 0.5))",
                  paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
                }}
                {...bind()}
              >
                <nav className="p-5">
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XIcon />
                  </button>
                  <div className="flex flex-col gap-3">
                    {loading ? (
                      <>
                        <div className="h-12 animate-pulse rounded-xl bg-gray-200"></div>
                        <div className="h-12 animate-pulse rounded-xl bg-gray-200"></div>
                        <div className="h-12 animate-pulse rounded-xl bg-gray-200"></div>
                      </>
                    ) : (
                      <>
                        <SidebarItem
                          href="/"
                          icon={<HomeIcon />}
                          text="خانه"
                        />
                        <button
                          onClick={() => {
                            onSearchClick?.();
                            onClose();
                          }}
                          className="relative flex items-center gap-2 rounded-lg px-5 py-3 text-gray-700 transition-all hover:bg-pink-50 w-full text-right"
                        >
                          <SearchIcon className="text-pink-500" />
                          <span className="text-sm font-medium">جستجو</span>
                        </button>
                        {menuItems.slice(1).map((item) => {
                          // Create a simple icon component for categories
                          // Using a placeholder icon since we don't have specific category icons
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="relative flex items-center gap-2 rounded-lg px-5 py-3 text-gray-700 transition-all hover:bg-pink-50"
                              onClick={onClose}
                            >
                              <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                          );
                        })}
                      </>
                    )}
                  </div>
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
