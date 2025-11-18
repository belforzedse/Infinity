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

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-xs text-right text-slate-400">نام</th>
            <th className="text-xs text-right text-slate-400">نامک</th>
            <th className="text-xs text-right text-slate-400">والد</th>
            <th className="text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((category) => (
            <tr key={category.id} className="">
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
  );
};

export default SetCategoryTable;
