import Image from "next/image";
import Link from "next/link";

export type StorefrontLogoProps = {
  /** Defaults to `/` (store home). */
  href?: string;
};

/** Customer-facing header/footer logo (`/images/full-logo.png`). */
export function StorefrontLogo({ href = "/" }: StorefrontLogoProps) {
  return (
    <Link href={href}>
      <div className="relative h-[52px] w-[150px] md:h-[72px] md:w-[210px]">
        <Image
          src="/images/full-logo.png"
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
