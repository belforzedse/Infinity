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
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl">
      <div className="flex items-center gap-3 w-full justify-between mb-2">
        <h2 className="text-base text-neutral-600">جزییات محصول</h2>

        <div className="bg-gray-50 h-9 w-9 rounded-lg flex items-center justify-center text-gray-600">
          <SettingIcon />
        </div>
      </div>

      <MainCategorySelector isEditMode={isEditMode} />

      <SimilarCategorySelector isEditMode={isEditMode} />

      <Tags isEditMode={isEditMode} />
    </div>
  );
}
