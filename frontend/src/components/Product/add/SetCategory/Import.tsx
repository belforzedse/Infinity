import React, { useState } from "react";
import PlusIcon from "../../Icons/PlusIcon";
import Select, { Option } from "@/components/Kits/Form/Select";
import { useProductCategory } from "@/hooks/product/useCategory";
import { CategoryData } from "@/services/super-admin/product/cetegory/create";
import { getAllCategories } from "@/services/super-admin/product/cetegory/getAll";
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
    productCategoryDataAtomPagination
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
    <div className="pb-4 border-b border-slate-50 mb-3">
      <form
        onSubmit={handleSubmit}
        className="gap-1 items-center w-full grid-cols-7 grid h-9"
      >
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="نام"
          className="px-4 py-1.5 border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent col-span-2 min-h-9 max-h-9 text-sm text-neutral-800"
        />

        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="نامک"
          className="px-4 py-1.5 border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent col-span-2 min-h-9 max-h-9 text-sm text-neutral-800"
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
          className="bg-pink-50 flex justify-center gap-1 items-center border border-pink-500 text-pink-500 text-xs mr-1 rounded-lg min-h-9"
        >
          <span>{isCreateCategoryLoading ? "" : "افزودن"}</span>
          <PlusIcon
            className={classNames(
              "text-pink-500 w-3 h-3",
              isCreateCategoryLoading && "animate-spin"
            )}
          />
        </button>
      </form>
    </div>
  );
};

export default ImportCategorty;
