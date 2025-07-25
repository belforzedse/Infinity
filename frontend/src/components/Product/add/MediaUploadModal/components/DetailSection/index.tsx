import DeleteIcon from "@/components/Product/Icons/DeleteIcon";
import { Dispatch, SetStateAction } from "react";
import { SelectedImageDetailsSection } from "../../types";
import DetailsSectionText from "./text";

interface DetailsSectionProps {
  selectedImage: SelectedImageDetailsSection | null;
  setSelectedImage: Dispatch<
    SetStateAction<SelectedImageDetailsSection | null>
  >;
}

export default function DetailsSection({
  selectedImage,
  setSelectedImage,
}: DetailsSectionProps) {
  const handleCopyUrl = () => {
    if (selectedImage?.url) {
      navigator.clipboard.writeText(selectedImage.url);
    }
  };

  return (
    <div className="bg-white rounded-lg p-2">
      {selectedImage ? (
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-col justify-between">
            <h3 className="text-base text-neutral-600 text-right mb-3">
              جزئیات پیوست
            </h3>

            <div className="flex gap-2 border-b pb-3 mb-3 border-slate-100">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="w-[70px] h-[70px] object-cover rounded-md"
              />

              <div className="flex flex-col justify-between items-start text-sm text-gray-500">
                <div className="text-[10px] leading-3">
                  {selectedImage.name}
                </div>
                <div className="text-[10px] text-neutral-400 leading-3 text-right">
                  {selectedImage.date || "آبان ۹, ۱۴۰۳"}
                </div>
                <div className="text-[10px] text-neutral-400 leading-3">
                  {selectedImage.size || "۱ مگابایت"}
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-pink-600 flex items-center gap-1"
                >
                  <span className="text-[10px] leading-3">حذف برای همیشه</span>
                  <DeleteIcon className="w-3 h-3 text-pink-600 stroke-pink-600" />
                </button>
              </div>
            </div>

            <DetailsSectionText
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
            />
          </div>

          <div className="flex justify-end">
            <button className="bg-pink-500 text-white rounded-lg p-2 text-xs w-24">
              درج در محصول
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
