"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/Kits/Modal";
import { getAllCategories } from "@/services/super-admin/product/category/getAll";
import type { categoryResponseType } from "@/services/super-admin/product/category/getAll";

export interface DeleteCategoryModalCategory {
  id: string | number;
  title: string;
}

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: DeleteCategoryModalCategory | null;
  onConfirm: (targetCategoryId: number) => void | Promise<void>;
  isDeleting?: boolean;
}

const parseCategoriesFromResponse = (
  response: unknown,
): categoryResponseType[] => {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object" && "data" in response) {
    const data = (response as { data: unknown }).data;
    if (Array.isArray(data)) return data as categoryResponseType[];
    if (data && typeof data === "object" && "data" in data) {
      const inner = (data as { data: unknown }).data;
      if (Array.isArray(inner)) return inner as categoryResponseType[];
    }
  }
  return [];
};

export default function DeleteCategoryModal({
  isOpen,
  onClose,
  category,
  onConfirm,
  isDeleting = false,
}: DeleteCategoryModalProps) {
  const [categories, setCategories] = useState<categoryResponseType[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  const categoryIdNum =
    category?.id != null
      ? typeof category.id === "string"
        ? Number.parseInt(category.id, 10)
        : category.id
      : null;

  const fetchCategories = useCallback(async () => {
    if (!isOpen) return;
    setIsLoadingCategories(true);
    try {
      const response = await getAllCategories();
      const list = parseCategoriesFromResponse(response);
      setCategories(list);
    } catch {
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSelectedTargetId("");
    }
  }, [isOpen, fetchCategories]);

  const targetOptions = categories.filter((c) => {
    const cid = c.id;
    return cid !== categoryIdNum;
  });

  const handleConfirm = () => {
    const id = Number(selectedTargetId);
    if (!Number.isInteger(id) || id <= 0) return;
    void onConfirm(id);
  };

  const canConfirm = selectedTargetId !== "" && !isDeleting;
  const hasOptions = targetOptions.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="حذف دسته‌بندی"
      className="max-w-md"
    >
      <div className="flex flex-col gap-6">
        <p className="text-sm text-right text-neutral-600">
          آیا از حذف دسته‌بندی &quot;{category?.title ?? ""}&quot; اطمینان دارید؟
          محصولات این دسته به دسته‌بندی انتخابی منتقل می‌شوند.
        </p>

        <div>
          <label
            htmlFor="delete-category-target"
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            دسته‌بندی مقصد برای محصولات
          </label>
          {isLoadingCategories ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
              در حال بارگیری...
            </p>
          ) : !hasOptions ? (
            <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              دسته‌بندی دیگری برای انتقال وجود ندارد. امکان حذف وجود ندارد.
            </p>
          ) : (
            <select
              id="delete-category-target"
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
              disabled={isDeleting}
            >
              <option value="">انتخاب دسته‌بندی مقصد</option>
              {targetOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.attributes?.Title ?? `دسته ${c.id}`}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || !hasOptions}
            data-testid="delete-category-confirm"
            className="rounded-xl bg-red-600 px-5 py-2.5 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                در حال حذف...
              </span>
            ) : (
              "حذف"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-neutral-700 hover:bg-slate-50 disabled:opacity-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </Modal>
  );
}
