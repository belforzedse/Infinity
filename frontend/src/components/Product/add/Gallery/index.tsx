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
            "group relative aspect-square cursor-pointer overflow-hidden rounded-lg",
            "border-2",
            selectedImages.includes(image.id)
              ? "border-pink-500"
              : "border-transparent hover:border-gray-300",
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
              "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity",
              selectedImages.includes(image.id)
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
            )}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white">
              {selectedImages.includes(image.id) && (
                <div className="h-3 w-3 rounded-full bg-white" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
