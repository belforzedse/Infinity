import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/">
      <div className="relative h-[56px] w-[90px] md:h-[68px] md:w-[110px]">
        <Image
          src="/images/full-logo.png"
          alt="Logo"
          fill
          className="object-contain"
        />
      </div>
    </Link>
  );
}
