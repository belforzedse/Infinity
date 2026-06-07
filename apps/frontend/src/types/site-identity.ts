/**
 * Site identity & FAQ types (Strapi v4 `site-identity` / `site-faq` single types).
 * Shared by the public data layer and the Super Admin Identity hub.
 */

export type SocialPlatform =
  | "instagram"
  | "telegram"
  | "whatsapp"
  | "bale"
  | "x"
  | "linkedin"
  | "youtube"
  | "aparat"
  | "eitaa"
  | "rubika"
  | "other";

export type ContactNumberType = "phone" | "mobile" | "whatsapp";

export interface IdentityPhone {
  label?: string;
  number: string;
}

export interface IdentitySocialLink {
  platform: SocialPlatform;
  url: string;
  label?: string;
}

export interface IdentityContactNumber {
  label?: string;
  number: string;
  type?: ContactNumberType;
}

export interface IdentityStore {
  name?: string;
  address?: string;
  phones: IdentityPhone[];
  wazeLink?: string;
  neshanLink?: string;
  baladLink?: string;
  googleMapsLink?: string;
  showInFooter: boolean;
  showInAbout: boolean;
  socialLinks: IdentitySocialLink[];
}

export interface SiteIdentity {
  siteName: string;
  /** Brand / business description, used for metadata and structured data. */
  brandDescription?: string;
  /** Primary contact email, used for structured data and the contact page. */
  contactEmail?: string;
  supportHours?: string;
  /** Whether the business has any physical store at all. */
  hasPhysicalStores: boolean;
  hasMultipleStores: boolean;
  stores: IdentityStore[];
  socialLinks: IdentitySocialLink[];
  contactNumbers: IdentityContactNumber[];
}

export interface SiteFaqItem {
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
}

export interface SiteFaqCategory {
  title: string;
  description?: string;
  order?: number;
  items: SiteFaqItem[];
}

export interface SiteFaq {
  categories: SiteFaqCategory[];
}
