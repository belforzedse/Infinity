import { Dispatch, SetStateAction, useState } from "react";
import { SelectedImageDetailsSection } from "../../types";
import CopyIcon from "@/components/Product/Icons/CopyIcon";

interface DetailsSectionTextProps {
  selectedImage: SelectedImageDetailsSection | null;
  setSelectedImage: Dispatch<
    SetStateAction<SelectedImageDetailsSection | null>
  >;
}

export default function DetailsSectionText({
  selectedImage,
  setSelectedImage,
}: DetailsSectionTextProps) {
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");

  const handleCopyUrl = () => {
    if (selectedImage?.url) {
      navigator.clipboard.writeText(selectedImage.url);
    }
  };

  return (
    <div className="flex flex-col gap-1 justify-between h-full">
      <h4 className="text-xs text-right text-neutral-600">متن جایگزین</h4>

      <input
        type="text"
        className="w-full border border-slate-100 text-neutral-600 rounded-md text-right py-2 px-5 text-xs"
        value={selectedImage?.name || ""}
        onChange={(e) =>
          selectedImage &&
          setSelectedImage({
            ...selectedImage,
            name: e.target.value,
          })
        }
      />

      <div className="mt-3">
        <div className="text-right mb-1 text-xs text-neutral-600">
          نشانی پرونده
        </div>
        <div className="relative">
          <input
            type="text"
            className="w-full border text-slate-400 rounded-lg p-3 border-slate-100 text-right pl-3 pr-8 text-xs"
            value={selectedImage?.url || ""}
            readOnly
          />
          <button
            onClick={handleCopyUrl}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-pink-500"
          >
            <CopyIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
