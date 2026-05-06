import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";

interface SuperAdminLogoProps {
  /** When true, renders a small icon-sized logo for collapsed sidebar */
  compact?: boolean;
}

export default function SuperAdminLogo({ compact = false }: SuperAdminLogoProps): ReactElement {
  if (compact) {
    return (
      <Link href="/" className="flex items-center justify-center" aria-label="Logo">
        <div className="relative h-9 w-9 shrink-0 md:h-10 md:w-10">
          <Image
            src="/Logo.png"
            alt="Logo"
            fill
            className="object-contain"
            sizes="40px"
            priority
          />
        </div>
      </Link>
    );
  }

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

