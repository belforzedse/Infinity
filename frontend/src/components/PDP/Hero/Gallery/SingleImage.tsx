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
    <div className="flex-1 h-full">
      <div className="h-[485px] w-full relative rounded-3xl overflow-hidden">
        {type === "video" ? (
          <video
            className="w-full h-full object-contain"
            src={src}
            controls
            loop
          />
        ) : (
          <Image
            className="w-full h-full object-cover"
            src={src}
            alt={alt || ""}
            fill
          />
        )}

        <button className="rounded-full w-[64px] h-[64px] bg-white items-center justify-center absolute top-2 left-2 z-10 border border-pink-200 flex-col gap-2 hidden md:flex">
          <div className="text-[9px] text-pink-600">استایل بساز</div>
          <ChevronDownIcon />
        </button>

        <div className="absolute bottom-3 left-[50%] translate-x-[-50%] z-10">
          <NavigationButtons
            goToNextImage={goToNextImage}
            goToPreviousImage={goToPreviousImage}
          />
        </div>
      </div>
    </div>
  );
}
