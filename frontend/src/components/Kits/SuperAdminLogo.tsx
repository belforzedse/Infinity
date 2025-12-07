import Image from "next/image";
import Link from "next/link";

export default function SuperAdminLogo() {
  return (
    <Link href="/">
      <div className="relative h-[52px] w-[150px] md:h-[72px] md:w-[210px]">
        <Image
          src="/Logo.png"
          alt="Logo"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 150px, 210px"
          priority
        />
      </div>
    </Link>
  );
}

