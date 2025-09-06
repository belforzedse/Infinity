import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import Voice from "../Kits/Voice";

type Props = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  audioSrc: string;
  direction?: "ltr" | "rtl";
};

export default function PLPSEOContent(props: Props) {
  const {
    title,
    description,
    imageSrc,
    imageAlt,
    audioSrc,
    direction = "rtl",
  } = props;

  return (
    <div
      className={`flex flex-col-reverse gap-5 ${
        direction === "ltr" ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      <div className="flex flex-1 flex-col gap-4">
        <h2 className="text-3xl hidden text-neutral-800 md:block">{title}</h2>
        <p className="text-sm text-neutral-500">{description}</p>
        <Voice audioSrc={audioSrc} className="mt-auto" />
      </div>

      <div className="relative h-[289px] w-full overflow-hidden rounded-3xl md:w-[423px]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 423px"
          loader={imageLoader}
        />
      </div>

      <h2 className="text-3xl text-neutral-800 md:hidden">{title}</h2>
    </div>
  );
}
