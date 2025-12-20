"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import { API_BASE_URL, ENDPOINTS } from "@/constants/api";

interface Category {
  id: number;
  title: string;
  slug: string;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PRODUCT.CATEGORY}?pagination[limit]=-1`);

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          setCategories(
            data.data
              .slice(0, 6)
              .map((cat: any) => ({
                id: cat.id,
                title: cat.attributes.Title,
                slug: cat.attributes.Slug || cat.id.toString(),
              })),
          );
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
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
                  <button onClick={onClose} className="text-pink-500 hover:text-pink-600">
                    <DeleteIcon />
                  </button>
                </Dialog.Title>

                {isLoading ? (
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex flex-col items-center gap-2">
                        <div className="h-20 w-20 animate-pulse rounded-full bg-gray-200" />
                        <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/plp?category=${category.slug}`}
                        onClick={onClose}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 p-4">
                          <span className="text-2xl">📦</span>
                        </div>
                        <span className="text-sm text-gray-800">{category.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
