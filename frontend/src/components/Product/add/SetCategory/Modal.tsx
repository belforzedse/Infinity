import React, { useState, useMemo } from "react";
import Modal from "@/components/Kits/Modal";
import DeleteIcon from "@/components/Kits/Icons/DeleteIcon";
import SearchIcon from "../../Icons/SearchIcon";
import ImportCategorty from "./Import";
import SetCategoryTable from "./Table";
import SetCategoryTablePagination from "./TablePagination";
import { useAtomValue } from "jotai";
import {
  productCategoryDataAtom,
  productCategoryDataAtomPagination,
} from "@/atoms/super-admin/products";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const [searchText, setSearchText] = useState("");

  const categoriesData = useAtomValue(productCategoryDataAtom);
  const categoriesDataPagination = useAtomValue(
    productCategoryDataAtomPagination
  );

  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) return categoriesData;

    return categoriesData.filter(
      (category) =>
        category.attributes.Title.toLowerCase().includes(
          searchText.toLowerCase()
        ) ||
        (category.attributes.Slug?.toLowerCase() || "").includes(
          searchText.toLowerCase()
        )
    );
  }, [categoriesData, searchText]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeIcon={<DeleteIcon className="text-pink-500" />}
      titleClassName="!justify-end"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <span className="text-neutral-600 text-base">دسته بندی محصولات</span>
          <div className="relative max-w-56">
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-100 text-slate-700 text-sm rounded-lg focus:outline-none text-right pr-10"
              placeholder="جستجو"
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchText(e.target.value)
              }
            />
            <SearchIcon className="absolute top-2.5 text-slate-500 right-2 w-6 h-6" />
          </div>
        </div>

        <ImportCategorty />

        <SetCategoryTable categories={filteredCategories} />

        <SetCategoryTablePagination
          totalItems={categoriesDataPagination.totalItems}
          itemsPerPage={categoriesDataPagination.itemsPerPage}
        />
      </div>
    </Modal>
  );
};

export default CategoryModal;
