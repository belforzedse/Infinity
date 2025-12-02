"use client";

import SettingIcon from "../../Icons/SettingIcon";
import MainCategorySelector from "./MainCategorySelector";
import Tags from "../Tags";
import SimilarCategorySelector from "./SimilarCategorySelector";

interface SetCategoryProps {
  isEditMode?: boolean;
}

export default function SetCategory({ isEditMode = false }: SetCategoryProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4">
      <div className="mb-2 flex w-full items-center justify-between gap-3">
        <h2 className="text-base text-neutral-600">جزییات محصول</h2>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
          <SettingIcon />
        </div>
      </div>

      <MainCategorySelector isEditMode={isEditMode} />

      <SimilarCategorySelector isEditMode={isEditMode} />

      <Tags isEditMode={isEditMode} />
    </div>
  );
}
