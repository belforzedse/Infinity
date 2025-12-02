import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import React from "react";
import DeleteIcon from "../../Icons/DeleteIcon";
import {
  productCategoryDataAtom,
  productCategoryDataAtomPagination,
} from "@/atoms/super-admin/products";
import { useSetAtom } from "jotai";
import { deleteCategory } from "@/services/super-admin/product/category/delete";
import type {
  categoryResponseType} from "@/services/super-admin/product/category/getAll";
import {
  getAllCategories,
} from "@/services/super-admin/product/category/getAll";

interface SetCategoryTableProps {
  categories: categoryResponseType[];
}

const SetCategoryTable: React.FC<SetCategoryTableProps> = ({ categories }) => {
  const setCategoriesData = useSetAtom(productCategoryDataAtom);
  const setCategoriesDataPagination = useSetAtom(productCategoryDataAtomPagination);

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
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
                  {category.attributes.Title}
                </td>
                <td className="text-sm py-3 text-right text-neutral-800">
                  {category.attributes.Slug}
                </td>
                <td className="text-sm py-3 text-right text-neutral-800">
                  {category.attributes.Parent ? category.attributes.Parent : ""}
                </td>
                <td className="text-sm py-3 text-right text-neutral-800">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {}}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id.toString())}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500"
                    >
                      <DeleteIcon className="h-5 w-5" />
                    </button>
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
