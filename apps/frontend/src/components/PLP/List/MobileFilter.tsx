"use client";

import PLPButton from "@/components/Kits/PLP/Button";
import FilterIcon from "../Icons/FilterIcon";
import AvailabilityFilter from "./Filter/Availability";
import PLPListFilter from "./Filter";
import XIcon from "../Icons/XIcon";
import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useQueryStates } from "nuqs";
import { plpQueryOptions, plpQueryParsers } from "@/components/PLP/queryState";

interface MobileFilterProps {
  categories?: Array<{ id: string; title: string }>;
  isLoadingCategories?: boolean;
  selectedCategory?: string;
}

const MOBILE_NAV_CLEARANCE = "calc(5rem + env(safe-area-inset-bottom))";

export default function PLPListMobileFilter({
  categories,
  isLoadingCategories = false,
  selectedCategory,
}: MobileFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useQueryStates(plpQueryParsers, plpQueryOptions);
  const { available } = query;

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  const handleAvailabilityChange = (checked: boolean) => {
    void setQuery({ available: checked ? "true" : null });
  };

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PLPButton
        className="h-auto w-auto shrink-0"
        text="نمایش فیلتر ها"
        rightIcon={<FilterIcon />}
        onClick={handleOpen}
      />

      <AvailabilityFilter
        onChange={handleAvailabilityChange}
        defaultChecked={available === "true"}
      />

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[1200]" onClose={handleClose} dir="rtl">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="flex h-full justify-start">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="flex h-[100dvh] w-[min(100vw,20rem)] flex-col bg-white shadow-xl">
                  <header
                    className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 pb-3"
                    style={{
                      paddingTop: "max(1rem, calc(0.75rem + env(safe-area-inset-top)))",
                    }}
                  >
                    <span className="text-lg font-medium text-neutral-900">همه فیلتر‌ها</span>
                    <button
                      type="button"
                      onClick={handleClose}
                      aria-label="بستن فیلترها"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200"
                    >
                      <XIcon />
                    </button>
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                    <PLPListFilter
                      showAvailableOnly={available === "true"}
                      categories={categories}
                      isLoadingCategories={isLoadingCategories}
                      selectedCategory={selectedCategory}
                      hideAvailability
                    />
                  </div>

                  <footer
                    className="shrink-0 border-t border-slate-100 px-4 pt-3"
                    style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
                  >
                    <PLPButton
                      text="اعمال فیلتر ها"
                      className="!text-base flex w-full items-center justify-center bg-infinity-primary text-white"
                      onClick={handleClose}
                    />
                  </footer>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
