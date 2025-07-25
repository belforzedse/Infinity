import Image from "next/image";
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
      className={`flex gap-5 flex-col-reverse ${
        direction === "ltr" ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      <div className="flex flex-col gap-4 flex-1">
        <h2 className="hidden md:block text-3xl text-neutral-800">{title}</h2>
        <p className="text-sm text-neutral-500">{description}</p>
        <Voice audioSrc={audioSrc} className="mt-auto" />
      </div>

      <div className="w-full relative md:w-[423px] h-[289px] overflow-hidden rounded-3xl">
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
      </div>

      <h2 className="md:hidden text-3xl text-neutral-800">{title}</h2>
    </div>
  );
}
