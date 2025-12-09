import Image from "next/image";
import type { ContactInfo } from "@/constants/footer";

const socialIcons = [
  {
    src: "/images/social/balad.png",
    alt: "Balad",
    href: "https://balad.ir/p/P6pI1lysjX6TFp",
  },
  {
    src: "/images/social/g-map.png",
    alt: "Google Map",
    href: "https://maps.app.goo.gl/JmaqkgoBPyoZhApu9?g_st=iw",
  },
  {
    src: "/images/social/neshan.png",
    alt: "Neshan",
    href: "https://nshn.ir/99_bflKtYGB7d-",
  },
  {
    src: "/images/social/waze.png",
    alt: "Waze",
    href: "https://waze.com/ul/htnw9rnt0n",
  },
];

interface StoresSectionProps {
  contactInfo: ContactInfo;
  storeLocations: string;
}

const StoresSection = ({ contactInfo, storeLocations }: StoresSectionProps) => {
  return (
    <div className="relative flex flex-col gap-4 border-slate-200 md:h-full md:min-h-[324px] md:border-r md:px-4 lg:px-6">
      <h3 className="text-base text-neutral-900">فروشگاه های حضوری</h3>

      <p className="text-sm text-right text-neutral-500 md:max-w-[280px]">
        {storeLocations}
      </p>
      <div className="flex gap-2">
        {socialIcons.map((icon) => (
          <a
            key={icon.src}
            href={icon.href}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform hover:scale-110"
          >
            <Image
              src={icon.src}
              alt={icon.alt}
              width={24}
              height={24}
              className="rounded-full"
              loading="lazy"
              sizes="24px"
            />
          </a>
        ))}
      </div>

      <div className="my-2 h-[1px] w-full bg-slate-200" />

      <div className="flex flex-col gap-2">
        <h3 className="text-base text-neutral-900">ارتباط با ما</h3>
        <div className="flex flex-col items-start gap-2">
          {contactInfo.phone && (
            <div className="flex items-center justify-end gap-1">
              <Image
                src="/images/social/phone.png"
                alt="Phone"
                width={16}
                height={16}
                loading="lazy"
                sizes="16px"
              />
              <span className="text-sm text-neutral-600">{contactInfo.phone}</span>
            </div>
          )}
          {contactInfo.whatsapp && (
            <div className="flex items-center justify-end gap-1">
              <Image
                src="/images/social/whatsapp.png"
                alt="WhatsApp"
                width={16}
                height={16}
                loading="lazy"
                sizes="16px"
              />
              <span className="text-sm text-neutral-600">{contactInfo.whatsapp}</span>
            </div>
          )}
          {contactInfo.instagram && (
            <div className="flex items-center justify-end gap-1">
              <Image
                src="/images/social/instagram.png"
                alt="Instagram"
                width={16}
                height={16}
                loading="lazy"
                sizes="16px"
              />
              <span className="text-sm text-neutral-600">{contactInfo.instagram}</span>
            </div>
          )}
          {contactInfo.telegram && (
            <div className="flex items-center justify-end gap-1">
              <Image
                src="/images/social/pinterest.png"
                alt="Pinterest"
                width={16}
                height={16}
                loading="lazy"
                sizes="16px"
              />
              <span className="text-sm text-neutral-600">{contactInfo.telegram}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoresSection;
