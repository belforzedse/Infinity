"use client";

import { useEffect, useState, useCallback } from "react";
import Modal from "@/components/Kits/Modal";
import { faNum } from "@/utils/faNum";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

const MAX_COMPARE_PRODUCTS = 4;
const COMPARE_LIST_KEY = "compareList";

export default function CompareModal({ isOpen, onClose, productId }: CompareModalProps) {
  const [status, setStatus] = useState<"adding" | "success" | "error" | "already-added">("adding");
  const [compareCount, setCompareCount] = useState(0);

  const addToCompareList = useCallback(() => {
    try {
      // Get current compare list
      const storedList = localStorage.getItem(COMPARE_LIST_KEY);
      let compareList: number[] = [];

      try {
        const parsed = storedList ? JSON.parse(storedList) : [];
        if (Array.isArray(parsed)) {
          // Validate and clean the array
          compareList = parsed
            .map(item => Number(item))
            .filter(item => Number.isFinite(item) && Number.isInteger(item));
        }
      } catch (e) {
        console.warn("Invalid compare list data in localStorage, resetting.");
        compareList = [];
      }

      // Check if product is already in list
      if (compareList.includes(productId)) {
        setStatus("already-added");
        setCompareCount(compareList.length);
        // Save cleaned list if it was different
        localStorage.setItem(COMPARE_LIST_KEY, JSON.stringify(compareList));
        return;
      }

      // Check if we've reached the max limit
      if (compareList.length >= MAX_COMPARE_PRODUCTS) {
        setStatus("error");
        setCompareCount(compareList.length);
        // Save cleaned list if it was different
        localStorage.setItem(COMPARE_LIST_KEY, JSON.stringify(compareList));
        return;
      }

      // Add product to list
      compareList.push(productId);
      localStorage.setItem(COMPARE_LIST_KEY, JSON.stringify(compareList));

      setStatus("success");
      setCompareCount(compareList.length);
    } catch (error) {
      console.error("Error adding product to compare list:", error);
      setStatus("error");
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen) {
      setStatus("adding");
      addToCompareList();
    }
  }, [isOpen, addToCompareList]);

  // Auto-close after 2 seconds on success
  useEffect(() => {
    if (status === "success" || status === "already-added") {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStatus("adding");
      setCompareCount(0);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md"
      aria-labelledby="compare-modal-title"
    >
      <div className="p-6 text-center">
        {status === "adding" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
            <p className="text-gray-700">در حال افزودن به لیست مقایسه...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 id="compare-modal-title" className="mb-2 text-xl font-bold text-gray-900">
                با موفقیت اضافه شد!
              </h3>
              <p className="text-gray-600">
                محصول به لیست مقایسه اضافه شد. ({faNum(compareCount)} محصول)
              </p>
            </div>
          </div>
        )}

        {status === "already-added" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 id="compare-modal-title" className="mb-2 text-xl font-bold text-gray-900">
                قبلاً اضافه شده
              </h3>
              <p className="text-gray-600">این محصول قبلاً در لیست مقایسه شما وجود دارد.</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h3 id="compare-modal-title" className="mb-2 text-xl font-bold text-gray-900">
                خطا
              </h3>
              <p className="text-gray-600">
                حداکثر {faNum(MAX_COMPARE_PRODUCTS)} محصول می‌توانید مقایسه کنید.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                لطفاً ابتدا یکی از محصولات را از لیست حذف کنید.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-pink-500 px-6 py-3 text-white transition-colors hover:bg-pink-600"
            >
              متوجه شدم
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
