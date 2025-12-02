import React, { useState, useMemo } from "react";
import Modal from "@/components/Kits/Modal";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import SearchIcon from "../../Icons/SearchIcon";
import ImportCategorty from "./Import";
import SetCategoryTable from "./Table";
import { useAtomValue } from "jotai";
import {
  productCategoryDataAtom,
} from "@/atoms/super-admin/products";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const [searchText, setSearchText] = useState("");

  const categoriesData = useAtomValue(productCategoryDataAtom);

  const filteredCategories = useMemo(() => {
    const safeCategoriesData = categoriesData || [];
    if (!searchText.trim()) return safeCategoriesData;

    return safeCategoriesData.filter(
      (category) =>
        category.attributes.Title.toLowerCase().includes(searchText.toLowerCase()) ||
        (category.attributes.Slug?.toLowerCase() || "").includes(searchText.toLowerCase()),
    );
  }, [categoriesData, searchText]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeIcon={<DeleteIcon className="text-pink-500" />}
      titleClassName="!justify-end"
      className="max-w-4xl lg:max-w-6xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <span className="text-base text-neutral-600">دسته بندی محصولات</span>
          <div className="relative max-w-56">
            <input
              type="text"
              className="text-sm w-full rounded-lg bg-slate-100 px-4 py-2.5 pr-10 text-right text-slate-700 focus:outline-none"
              placeholder="جستجو"
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
            />
            <SearchIcon className="absolute right-2 top-2.5 h-6 w-6 text-slate-500" />
          </div>
        </div>

        <ImportCategorty />

        <div className="max-h-[60vh] overflow-y-auto">
          <SetCategoryTable categories={filteredCategories} />
        </div>
      </div>
    </Modal>
  );
};

export default CategoryModal;
