"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ContactInfo } from "@/services/footer";

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
  contactInfo?: ContactInfo;
}

const StoresSection = ({ contactInfo }: StoresSectionProps) => {
  const [phone, setPhone] = useState<string>("017-325-304-39");
  const [whatsapp, setWhatsapp] = useState<string | null>("0901-655-25-30");
  const [instagram, setInstagram] = useState<string | null>(
    "infinity.color_boutique"
  );
  const [telegram, setTelegram] = useState<string | null>("InfinityColorShop");

  useEffect(() => {
    if (contactInfo) {
      setPhone(contactInfo.Phone);
      setWhatsapp(contactInfo.Whatsapp);
      setInstagram(contactInfo.Instagram);
      setTelegram(contactInfo.Telegram);
    }
  }, [contactInfo]);

  return (
    <div className="flex flex-col gap-4 relative md:px-[65px] md:border-r border-slate-200 md:h-full md:min-h-[324px]">
      <h3 className="text-neutral-900 text-base">فروشگاه های حضوری</h3>

      <p className="text-neutral-500 text-sm text-right md:max-w-[233px]">
        گرگان، بلوار ناهارخوران نبش عدالت 68، گنبد کاووس، ابتدای بلوار دانشجو
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
            />
          </a>
        ))}
      </div>

      <div className="w-full h-[1px] bg-slate-200 my-2" />

      <div className="flex flex-col gap-2">
        <h3 className="text-neutral-900 text-base">ارتباط با ما</h3>
        <div className="flex flex-col gap-2 items-start">
          {phone && (
            <div className="flex items-center gap-1 justify-end">
              <Image
                src="/images/social/phone.png"
                alt="Phone"
                width={16}
                height={16}
              />
              <span className="text-neutral-600 text-sm">{phone}</span>
            </div>
          )}
          {whatsapp && (
            <div className="flex items-center gap-1 justify-end">
              <Image
                src="/images/social/whatsapp.png"
                alt="WhatsApp"
                width={16}
                height={16}
              />
              <span className="text-neutral-600 text-sm">{whatsapp}</span>
            </div>
          )}
          {instagram && (
            <div className="flex items-center gap-1 justify-end">
              <Image
                src="/images/social/instagram.png"
                alt="Instagram"
                width={16}
                height={16}
              />
              <span className="text-neutral-600 text-sm">{instagram}</span>
            </div>
          )}
          {telegram && (
            <div className="flex items-center gap-1 justify-end">
              <Image
                src="/images/social/pinterest.png"
                alt="Pinterest"
                width={16}
                height={16}
              />
              <span className="text-neutral-600 text-sm">{telegram}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoresSection;
