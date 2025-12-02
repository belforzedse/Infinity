import type { Dispatch, SetStateAction } from "react";
import type { SelectedImageDetailsSection } from "../../types";
import CopyIcon from "@/components/Product/Icons/CopyIcon";

interface DetailsSectionTextProps {
  selectedImage: SelectedImageDetailsSection | null;
  setSelectedImage: Dispatch<SetStateAction<SelectedImageDetailsSection | null>>;
}

export default function DetailsSectionText({
  selectedImage,
  setSelectedImage,
}: DetailsSectionTextProps) {
  const handleCopyUrl = () => {
    if (selectedImage?.url) {
      navigator.clipboard.writeText(selectedImage.url);
    }
  };

  return (
    <div className="flex h-full flex-col justify-between gap-1">
      <h4 className="text-xs text-right text-neutral-600">متن جایگزین</h4>

      <input
        type="text"
        className="text-xs w-full rounded-md border border-slate-100 px-5 py-2 text-right text-neutral-600"
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
        <div className="text-xs mb-1 text-right text-neutral-600">نشانی پرونده</div>
        <div className="relative">
          <input
            type="text"
            className="text-xs w-full rounded-lg border border-slate-100 p-3 pl-3 pr-8 text-right text-slate-400"
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
