"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { USER_SIDEBAR_ITEMS } from "@/components/User/Constnats";
import SidebarItem from "@/components/User/Sidebar/SidebarItem";
import XIcon from "../Icons/XIcon";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const Menu = ({ isOpen, onClose }: Props) => {
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
              <Dialog.Panel className="h-fit w-[216px] transform overflow-hidden rounded-bl-xl bg-white shadow-xl transition-all">
                <nav className="p-5">
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon />
                  </button>
                  <div className="flex flex-col gap-3 lg:gap-2 lg:px-8">
                    {USER_SIDEBAR_ITEMS.map((item) => (
                      <SidebarItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        text={item.text}
                      />
                    ))}
                  </div>
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Menu;
