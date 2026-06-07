import { createElement } from "react";
import type { ComponentType } from "react";
import { MessageCircle } from "lucide-react";
import {
  SiAparat,
  SiInstagram,
  SiLinkedin,
  SiTelegram,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";
import type {
  ContactNumberType,
  IdentityStore,
  SocialPlatform,
} from "@/types/site-identity";

type SocialIconComponent = ComponentType<{
  "aria-hidden"?: boolean;
  className?: string;
  color?: string;
  focusable?: boolean;
  size?: number;
}>;

export type SocialPlatformMeta = {
  value: SocialPlatform;
  label: string;
  adminLabel?: string;
  Icon?: SocialIconComponent;
  iconSrc?: string;
  color: string;
  hasPlaceholderIcon?: boolean;
};

const GenericSocialIcon = MessageCircle as SocialIconComponent;

export const SOCIAL_PLATFORM_META: Record<SocialPlatform, SocialPlatformMeta> = {
  instagram: {
    value: "instagram",
    label: "اینستاگرام",
    Icon: SiInstagram,
    color: "#E4405F",
  },
  telegram: {
    value: "telegram",
    label: "تلگرام",
    Icon: SiTelegram,
    color: "#26A5E4",
  },
  whatsapp: {
    value: "whatsapp",
    label: "واتساپ",
    Icon: SiWhatsapp,
    color: "#25D366",
  },
  bale: {
    value: "bale",
    label: "بله",
    iconSrc: "/images/social/bale.svg",
    color: "#0CBC8D",
  },
  x: {
    value: "x",
    label: "ایکس",
    adminLabel: "ایکس (توییتر)",
    Icon: SiX,
    color: "#000000",
  },
  linkedin: {
    value: "linkedin",
    label: "لینکدین",
    Icon: SiLinkedin,
    color: "#0A66C2",
  },
  youtube: {
    value: "youtube",
    label: "یوتیوب",
    Icon: SiYoutube,
    color: "#FF0000",
  },
  aparat: {
    value: "aparat",
    label: "آپارات",
    Icon: SiAparat,
    color: "#ED145B",
  },
  eitaa: {
    value: "eitaa",
    label: "ایتا",
    iconSrc: "/images/social/eitaa.svg",
    color: "#E37600",
  },
  rubika: {
    value: "rubika",
    label: "روبیکا",
    iconSrc: "/images/social/rubika.png",
    color: "#7D4593",
  },
  other: {
    value: "other",
    label: "شبکه اجتماعی",
    adminLabel: "سایر",
    Icon: GenericSocialIcon,
    color: "#6B7280",
    hasPlaceholderIcon: true,
  },
};

export const SOCIAL_PLATFORM_OPTIONS = Object.values(SOCIAL_PLATFORM_META).map((platform) => ({
  value: platform.value,
  label: platform.adminLabel ?? platform.label,
}));

/** Map link icons available under /public/images/social. */
export function storeMapLinks(store: IdentityStore): { src: string; alt: string; href: string }[] {
  const links: { src: string; alt: string; href: string }[] = [];
  if (store.baladLink) links.push({ src: "/images/social/balad.png", alt: "بلد", href: store.baladLink });
  if (store.googleMapsLink)
    links.push({ src: "/images/social/g-map.png", alt: "گوگل مپ", href: store.googleMapsLink });
  if (store.neshanLink)
    links.push({ src: "/images/social/neshan.png", alt: "نشان", href: store.neshanLink });
  if (store.wazeLink) links.push({ src: "/images/social/waze.png", alt: "ویز", href: store.wazeLink });
  return links;
}

export function getSocialPlatformMeta(platform: SocialPlatform): SocialPlatformMeta {
  return SOCIAL_PLATFORM_META[platform] ?? SOCIAL_PLATFORM_META.other;
}

export function SocialPlatformIcon({
  platform,
  size = 16,
  className,
}: {
  platform: SocialPlatform;
  size?: number;
  className?: string;
}) {
  const { Icon, color, iconSrc, label } = getSocialPlatformMeta(platform);
  const iconClassName = `shrink-0 ${className ?? ""}`.trim();

  if (iconSrc) {
    return createElement("img", {
      "aria-hidden": true,
      alt: "",
      className: iconClassName,
      height: size,
      src: iconSrc,
      title: label,
      width: size,
    });
  }

  if (!Icon) return null;

  return createElement(Icon, {
    "aria-hidden": true,
    className: iconClassName,
    color,
    focusable: false,
    size,
  });
}

export function contactIcon(type?: ContactNumberType): string {
  return type === "whatsapp" ? "/images/social/whatsapp.png" : "/images/social/phone.png";
}

export function platformLabel(platform: SocialPlatform): string {
  return getSocialPlatformMeta(platform).label;
}
