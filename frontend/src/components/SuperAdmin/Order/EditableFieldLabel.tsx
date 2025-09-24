"use client";

import React, { useState } from "react";
import EditIcon from "@/components/SuperAdmin/UpsertPage/Icons/EditIcon";

interface EditableFieldLabelProps {
  label: string;
  isAutoFilled: boolean;
  onToggleEdit: () => void;
  isEditable: boolean;
}

const EditableFieldLabel: React.FC<EditableFieldLabelProps> = ({
  label,
  isAutoFilled,
  onToggleEdit,
  isEditable,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      {isAutoFilled && (
        <>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
            خودکار
          </span>
          <button
            type="button"
            onClick={onToggleEdit}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
            title="ویرایش"
          >
            <EditIcon className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
};

export default EditableFieldLabel;