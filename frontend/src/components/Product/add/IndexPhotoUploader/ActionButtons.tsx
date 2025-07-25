import React from "react";
import EyeIcon from "../../Icons/EyeIcon";
import DeleteIcon from "../../Icons/DeleteIcon";
import EditIcon from "../../Icons/EditIcon";

interface ActionButtonsProps {
  onPreviewClick: () => void;
  onDeleteClick: () => void;
  onEditClick: () => void;
}

const IndexPhotoUploaderActionButtons: React.FC<ActionButtonsProps> = ({
  onPreviewClick,
  onDeleteClick,
  onEditClick,
}) => {
  const primaryButtonClassNames =
    "bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors h-12 w-12 flex justify-center items-center";

  return (
    <div className="flex gap-2">
      <button className={primaryButtonClassNames} onClick={onPreviewClick}>
        <EyeIcon className="w-6 h-6" />
      </button>
      <button className={primaryButtonClassNames} onClick={onDeleteClick}>
        <DeleteIcon className="w-6 h-6" />
      </button>
      <button
        className="bg-pink-500 rounded-xl text-white hover:bg-pink-600 transition-colors h-12 w-12 flex justify-center items-center"
        onClick={onEditClick}
      >
        <EditIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default IndexPhotoUploaderActionButtons;
