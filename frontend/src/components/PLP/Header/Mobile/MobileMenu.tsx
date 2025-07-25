"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";
import XIcon from "@/components/User/Icons/XIcon";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/hooks/api/useNavigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  href: string;
}

export default function MobileMenu({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  // Only trigger the API fetch when the menu is open
  const { navigation, loading } = useNavigation(isOpen);

  // Transform navigation items to MenuItem format
  const menuItems: MenuItem[] = [
    { label: "خانه", href: "/" },
    ...navigation.map((item) => ({
      label: item.title,
      href: `/plp?category=${item.slug}`,
    })),
  ];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-[280px] h-full transform overflow-hidden bg-white shadow-xl transition-all">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium text-neutral-800"
                    >
                      منو
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                    >
                      <XIcon />
                    </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                      <div className="flex flex-col gap-3">
                        <div className="h-12 bg-gray-200 animate-pulse rounded-xl"></div>
                        <div className="h-12 bg-gray-200 animate-pulse rounded-xl"></div>
                        <div className="h-12 bg-gray-200 animate-pulse rounded-xl"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {menuItems.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`px-4 py-3 rounded-xl transition-colors ${
                                isActive
                                  ? "bg-pink-50 text-pink-600"
                                  : "text-neutral-800 hover:bg-slate-50"
                              }`}
                              onClick={onClose}
                            >
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </nav>

                  <div className="p-4 border-t border-slate-100">
                    <Link
                      href="/order-tracking"
                      className="flex items-center justify-center gap-2 w-full bg-slate-50 text-neutral-800 rounded-xl px-4 py-3 hover:bg-slate-100 transition-colors"
                      onClick={onClose}
                    >
                      <span>پیگیری سفارش</span>
                    </Link>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
