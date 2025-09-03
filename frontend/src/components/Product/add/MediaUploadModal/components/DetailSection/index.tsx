import DeleteIcon from "@/components/Product/Icons/DeleteIcon";
import Image from "next/image";
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
    <div className="rounded-lg bg-white p-2">
      {selectedImage ? (
        <div className="flex h-full flex-col justify-between">
          <div className="flex flex-col justify-between">
            <h3 className="text-base mb-3 text-right text-neutral-600">
              جزئیات پیوست
            </h3>

            <div className="mb-3 flex gap-2 border-b border-slate-100 pb-3">
              <Image
                src={selectedImage.url}
                alt={selectedImage.name}
                width={70}
                height={70}
                className="h-[70px] w-[70px] rounded-md object-cover"
              />

              <div className="text-sm flex flex-col items-start justify-between text-gray-500">
                <div className="text-[10px] leading-3">
                  {selectedImage.name}
                </div>
                <div className="text-right text-[10px] leading-3 text-neutral-400">
                  {selectedImage.date || "آبان ۹, ۱۴۰۳"}
                </div>
                <div className="text-[10px] leading-3 text-neutral-400">
                  {selectedImage.size || "۱ مگابایت"}
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="flex items-center gap-1 text-pink-600"
                >
                  <span className="text-[10px] leading-3">حذف برای همیشه</span>
                  <DeleteIcon className="h-3 w-3 stroke-pink-600 text-pink-600" />
                </button>
              </div>
            </div>

            <DetailsSectionText
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
            />
          </div>

          <div className="flex justify-end">
            <button className="text-xs w-24 rounded-lg bg-pink-500 p-2 text-white">
              درج در محصول
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
