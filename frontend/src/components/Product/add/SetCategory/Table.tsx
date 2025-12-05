import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import CheckIcon from "@/components/Kits/Icons/CheckIcon";
import CloseIcon from "@/components/PLP/Icons/CloseIcon";
import React, { useState } from "react";
import {
  productCategoryDataAtom,
  productCategoryDataAtomPagination,
} from "@/atoms/super-admin/products";
import { useSetAtom } from "jotai";
import type {
  categoryResponseType} from "@/services/super-admin/product/category/getAll";
import {
  getAllCategories,
} from "@/services/super-admin/product/category/getAll";
import { updateCategory } from "@/services/super-admin/product/category/update";
import { toast } from "react-hot-toast";
import { X, Check } from "lucide-react";

interface SetCategoryTableProps {
  categories: categoryResponseType[];
}

const SetCategoryTable: React.FC<SetCategoryTableProps> = ({ categories }) => {
  const setCategoriesData = useSetAtom(productCategoryDataAtom);
  const setCategoriesDataPagination = useSetAtom(productCategoryDataAtomPagination);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const [draftSlug, setDraftSlug] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const refreshCategories = async () => {
    const response = await getAllCategories();
    // getAllCategories returns PaginatedResponse<categoryResponseType>
    // which has structure: { data: categoryResponseType[], meta: {...} }
    setCategoriesData(response?.data || []);
    setCategoriesDataPagination(response?.meta || {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 25,
    });
  };

  const handleEditClick = (category: categoryResponseType) => {
    setEditingId(category.id.toString());
    setDraftTitle(category.attributes.Title || "");
    setDraftSlug(category.attributes.Slug || "");
  };

  const handleSave = async (category: categoryResponseType) => {
    if (!draftTitle.trim() || !draftSlug.trim()) {
      toast.error("لطفاً نام و نامک را وارد کنید");
      return;
    }
    try {
      setSavingId(category.id.toString());
      await updateCategory(category.id, {
        Title: draftTitle.trim(),
        Slug: draftSlug.trim(),
        Parent: category.attributes.Parent || undefined,
      });
      toast.success("دسته‌بندی به‌روزرسانی شد");
      setEditingId(null);
      await refreshCategories();
    } catch (error) {
      console.error("Failed to update category", error);
      toast.error("خطا در به‌روزرسانی دسته‌بندی");
    } finally {
      setSavingId(null);
    }
  };

  // Split categories into two columns
  const midPoint = Math.ceil(categories.length / 2);
  const leftColumn = categories.slice(0, midPoint);
  const rightColumn = categories.slice(midPoint);

  const renderTable = (columnCategories: typeof categories, keyPrefix: string) => (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white z-10 border-b border-slate-200">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-xs text-right text-slate-400 bg-white py-2">نام</th>
              <th className="text-xs text-right text-slate-400 bg-white py-2">نامک</th>
              <th className="text-xs text-right text-slate-400 bg-white py-2">والد</th>
              <th className="text-right bg-white py-2"></th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="overflow-y-auto flex-1">
        <table className="w-full">
          <tbody className="divide-y divide-slate-100">
            {columnCategories.map((category) => (
              <tr key={`${keyPrefix}-${category.id}`} className="">
                <td className="text-sm py-3 text-right text-neutral-800">
                  {editingId === category.id.toString() ? (
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                    />
                  ) : (
                    category.attributes.Title
                  )}
                </td>
                <td className="text-sm py-3 text-right text-neutral-800">
                  {editingId === category.id.toString() ? (
                    <input
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-pink-400 focus:outline-none"
                      value={draftSlug}
                      onChange={(e) => setDraftSlug(e.target.value)}
                    />
                  ) : (
                    category.attributes.Slug
                  )}
                </td>
                <td className="text-sm py-3 text-right text-neutral-800">
                  {category.attributes.Parent ? category.attributes.Parent : ""}
                </td>
                <td className="text-sm py-3 text-right text-neutral-800">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === category.id.toString() ? (
                      <>
                        <button
                          onClick={() => handleSave(category)}
                          disabled={savingId === category.id.toString()}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-green-600 disabled:opacity-60"
                          title="ذخیره"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={savingId === category.id.toString()}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-red-600 disabled:opacity-60"
                          title="انصراف"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditClick(category)}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500"
                        title="ویرایش"
                      >
                        <EditIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="w-full max-h-[60vh] border border-slate-200 rounded-lg overflow-hidden">
          {renderTable(leftColumn, "left")}
        </div>
        <div className="w-full max-h-[60vh] border border-slate-200 rounded-lg overflow-hidden">
          {renderTable(rightColumn, "right")}
        </div>
      </div>
    </div>
  );
};

export default SetCategoryTable;
