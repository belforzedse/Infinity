import Image from "next/image";
import classNames from "classnames";

interface GalleryProps {
  images: {
    id: string;
    url: string;
    title: string;
  }[];
  onSelect: (id: string) => void;
  selectedImages: string[];
}

export default function Gallery({
  images,
  onSelect,
  selectedImages,
}: GalleryProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className={classNames(
            "relative aspect-square rounded-lg overflow-hidden cursor-pointer group",
            "border-2",
            selectedImages.includes(image.id)
              ? "border-pink-500"
              : "border-transparent hover:border-gray-300"
          )}
          onClick={() => onSelect(image.id)}
        >
          <Image
            src={image.url}
            alt={image.title}
            fill
            className="object-cover"
          />
          <div
            className={classNames(
              "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
              selectedImages.includes(image.id)
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              {selectedImages.includes(image.id) && (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
