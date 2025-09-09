import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import { categories } from "@/constants/categories";

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoriesModal({
  isOpen,
  onClose,
}: CategoriesModalProps) {
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
                <Dialog.Title
                  as="div"
                  className="mb-4 flex items-center justify-between"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    دسته بندی ها
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-pink-500 hover:text-pink-600"
                  >
                    <DeleteIcon />
                  </button>
                </Dialog.Title>

                <div className="grid grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/plp?category=${category.slug}`}
                      onClick={onClose}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full p-4"
                        style={{ backgroundColor: category.backgroundColor }}
                      >
                        <Image
                          src={category.image}
                          alt={category.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-contain"
                        />
                      </div>
                      <span className="text-sm text-gray-800">
                        {category.name}
                      </span>
                    </Link>
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
