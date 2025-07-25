import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/">
      <div className="w-[90px] md:w-[110px] h-[56px] md:h-[68px] relative">
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
