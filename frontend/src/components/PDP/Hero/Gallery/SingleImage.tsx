import Image from "next/image";
import ChevronDownIcon from "../../Icons/ChevronDownIcon";
import NavigationButtons from "../../NavigationButtons";

type Props = {
  type: "video" | "image";
  src: string;
  alt?: string;
  goToNextImage: () => void;
  goToPreviousImage: () => void;
};

export default function PDPHeroGallerySingleImage(props: Props) {
  const { type, src, alt, goToNextImage, goToPreviousImage } = props;

  return (
    <div className="h-full flex-1">
      <div className="relative h-[485px] w-full overflow-hidden rounded-3xl">
        {type === "video" ? (
          <video
            className="h-full w-full object-contain"
            src={src}
            controls
            loop
          />
        ) : (
          <Image
            className="h-full w-full object-cover"
            src={src}
            alt={alt || ""}
            fill
          />
        )}

        <button className="absolute left-2 top-2 z-10 hidden h-[64px] w-[64px] flex-col items-center justify-center gap-2 rounded-full border border-pink-200 bg-white md:flex">
          <div className="text-[9px] text-pink-600">استایل بساز</div>
          <ChevronDownIcon />
        </button>

        <div className="absolute bottom-3 left-[50%] z-10 translate-x-[-50%]">
          <NavigationButtons
            goToNextImage={goToNextImage}
            goToPreviousImage={goToPreviousImage}
          />
        </div>
      </div>
    </div>
  );
}
