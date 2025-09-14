"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearch({ isOpen, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't search if query is empty
    if (!searchQuery.trim()) return;

    // Close the search modal
    onClose();

    // Redirect to search results page with the query
    router.push(`/plp?search=${encodeURIComponent(searchQuery.trim())}`);
  };

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden bg-white p-6 text-right align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg mb-4 font-medium leading-6 text-gray-900"
                >
                  جستجو
                </Dialog.Title>

                <div className="mt-2">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-sm w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                      placeholder="جستجو در محصولات..."
                      dir="rtl"
                    />
                    <button
                      type="submit"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.7647 11.7647L14.6667 14.6667"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.33333 12.0833C10.3584 12.0833 11.9999 10.4417 11.9999 8.41667C11.9999 6.39162 10.3584 4.75 8.33333 4.75C6.30828 4.75 4.66666 6.39162 4.66666 8.41667C4.66666 10.4417 6.30828 12.0833 8.33333 12.0833Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </form>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="text-sm inline-flex justify-center rounded-md border border-transparent bg-pink-100 px-4 py-2 font-medium text-pink-900 hover:bg-pink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    بستن
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
