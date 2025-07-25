import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import React from "react";
import DeleteIcon from "../../Icons/DeleteIcon";
import {
  productCategoryDataAtom,
  productCategoryDataAtomPagination,
} from "@/atoms/super-admin/products";
import { useSetAtom } from "jotai";
import { deleteCategory } from "@/services/super-admin/product/cetegory/delete";
import {
  categoryResponseType,
  getAllCategories,
} from "@/services/super-admin/product/cetegory/getAll";

interface SetCategoryTableProps {
  categories: categoryResponseType[];
}

const SetCategoryTable: React.FC<SetCategoryTableProps> = ({ categories }) => {
  const setCategoriesData = useSetAtom(productCategoryDataAtom);
  const setCategoriesDataPagination = useSetAtom(
    productCategoryDataAtomPagination
  );

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    const categories = await getAllCategories();
    setCategoriesData(categories.data);
    setCategoriesDataPagination(categories.meta);
  };

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-right text-slate-400 text-xs">نام</th>
            <th className="text-right text-slate-400 text-xs">نامک</th>
            <th className="text-right text-slate-400 text-xs">والد</th>
            <th className="text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((category, index) => (
            <tr key={index} className="">
              <td className="py-3 text-right text-sm text-neutral-800">
                {category.attributes.Title}
              </td>
              <td className="py-3 text-right text-sm text-neutral-800">
                {category.attributes.Slug}
              </td>
              <td className="py-3 text-right text-sm text-neutral-800">
                {category.attributes.Parent ? category.attributes.Parent : ""}
              </td>
              <td className="py-3 text-right text-sm text-neutral-800">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {}}
                    className="text-slate-500 bg-slate-100 w-6 h-6 flex justify-center items-center rounded-md"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id.toString())}
                    className="text-slate-500 bg-slate-100 w-6 h-6 flex justify-center items-center rounded-md"
                  >
                    <DeleteIcon className="w-5 h-5" />
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
