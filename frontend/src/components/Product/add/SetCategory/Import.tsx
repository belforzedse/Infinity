import React, { useState } from "react";
import PlusIcon from "../../Icons/PlusIcon";
import Select, { Option } from "@/components/Kits/Form/Select";
import { useProductCategory } from "@/hooks/product/useCategory";
import { CategoryData } from "@/services/super-admin/product/category/create";
import { getAllCategories } from "@/services/super-admin/product/category/getAll";
import {
  productCategoryDataAtom,
  productCategoryDataAtomPagination,
} from "@/atoms/super-admin/products";
import { useSetAtom } from "jotai";
import classNames from "classnames";

interface CategoryFormData {
  name: string;
  slug: string;
  parent: string;
}

const ImportCategorty = () => {
  const { categoryOptions, createMainCategory, isCreateCategoryLoading } =
    useProductCategory();
  const setCategoriesData = useSetAtom(productCategoryDataAtom);
  const setCategoriesDataPagination = useSetAtom(
    productCategoryDataAtomPagination,
  );

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    parent: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleParentChange = (option: Option) => {
    setFormData((prev) => ({
      ...prev,
      parent: option.id.toString(),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const categoryData: CategoryData = {
      Title: formData.name,
      Slug: formData.slug,
    };

    if (formData.parent !== "") {
      categoryData.Parent = formData.parent;
    }

    await createMainCategory(categoryData);
    const categories = await getAllCategories();
    setCategoriesData(categories.data);
    setCategoriesDataPagination(categories.meta);
  };

  return (
    <div className="mb-3 border-b border-slate-50 pb-4">
      <form
        onSubmit={handleSubmit}
        className="grid h-9 w-full grid-cols-7 items-center gap-1"
      >
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="نام"
          className="text-sm col-span-2 max-h-9 min-h-9 rounded-lg border border-slate-100 px-4 py-1.5 text-neutral-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="نامک"
          className="text-sm col-span-2 max-h-9 min-h-9 rounded-lg border border-slate-100 px-4 py-1.5 text-neutral-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <Select
          value={
            formData.parent
              ? { id: formData.parent, name: formData.parent }
              : null
          }
          onChange={handleParentChange}
          options={categoryOptions.map((category) => ({
            id: category.id.toString(),
            name: category.attributes.Title,
          }))}
          placeholder="والد"
          className="col-span-2 max-h-9 text-neutral-800"
          selectButtonClassName="min-h-9 max-h-9 py-1"
        />

        <button
          type="submit"
          className="text-xs mr-1 flex min-h-9 items-center justify-center gap-1 rounded-lg border border-pink-500 bg-pink-50 text-pink-500"
        >
          <span>{isCreateCategoryLoading ? "" : "افزودن"}</span>
          <PlusIcon
            className={classNames(
              "h-3 w-3 text-pink-500",
              isCreateCategoryLoading && "animate-spin",
            )}
          />
        </button>
      </form>
    </div>
  );
};

export default ImportCategorty;
