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
              <Dialog.Panel className="h-full w-[280px] transform overflow-hidden bg-white shadow-xl transition-all">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <Dialog.Title as="h3" className="text-lg font-medium text-neutral-800">
                      منو
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 transition-colors hover:bg-slate-50"
                    >
                      <XIcon />
                    </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                      <div className="flex flex-col gap-3">
                        <div className="h-12 animate-pulse rounded-xl bg-gray-200"></div>
                        <div className="h-12 animate-pulse rounded-xl bg-gray-200"></div>
                        <div className="h-12 animate-pulse rounded-xl bg-gray-200"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {menuItems.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`rounded-xl px-4 py-3 transition-colors ${
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

                  <div className="border-t border-slate-100 p-4">
                    <Link
                      href="/order-tracking"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-neutral-800 transition-colors hover:bg-slate-100"
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
