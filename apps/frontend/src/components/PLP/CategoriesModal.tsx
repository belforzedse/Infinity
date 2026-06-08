"use client";

import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import CategoryCard from "@/components/Categories/CategoryCard";
import { useProductCategories } from "@/hooks/useProductCategories";

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const { categories, isLoading } = useProductCategories({ parentOnly: true });

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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-right align-middle shadow-xl transition-all">
                <Dialog.Title as="div" className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">دسته بندی ها</h3>
                  <button onClick={onClose} className="text-infinity-primary hover:text-infinity-primary">
                    <DeleteIcon />
                  </button>
                </Dialog.Title>

                <div className="grid grid-cols-3 gap-4">
                  {isLoading && (
                    <div className="col-span-3 text-center text-xs text-neutral-500">
                      در حال بارگذاری...
                    </div>
                  )}
                  {!isLoading && categories.length === 0 && (
                    <div className="col-span-3 text-center text-xs text-neutral-500">
                      دسته‌بندی برای نمایش وجود ندارد.
                    </div>
                  )}
                  {!isLoading &&
                    categories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        size="compact"
                        onClick={onClose}
                      />
                    ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
