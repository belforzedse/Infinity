import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/">
      <div className="relative h-[56px] w-[90px] md:h-[95px] md:w-[152px]">
        <Image
          src="/images/cropped-021.webp"
          alt="Logo"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 90px, 110px"
          priority
        />
      </div>
    </Link>
  );
}
