const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://new.infinitycolor.co";
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "https://api.infinitycolor.co";

interface OrganizationSchemaProps {
  /** Site/brand name. Falls back to the historical hardcoded value. */
  name?: string;
  /** Brand description. Falls back to the historical hardcoded value. */
  description?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  /** Full list of social profile URLs (preferred over `instagram`). */
  sameAs?: string[];
  streetAddress?: string;
  postalCode?: string;
}

const DEFAULT_ORG_NAME = "فروشگاه پوشاک اینفینیتی";
const DEFAULT_ORG_DESCRIPTION =
  "پوشاک اینفینیتی با عرضه پوشاک با بهترین قیمت و کیفیت همیشه سعی کرده است تا بهترین ها را برای شما به ارمغان بیاورد!";

export function OrganizationSchema({
  name,
  description,
  phone,
  email,
  instagram,
  sameAs: sameAsProp,
  streetAddress,
  postalCode,
}: OrganizationSchemaProps = {}) {
  // Build sameAs array. Prefer the explicit social link list (from site identity),
  // then a single instagram prop, then the historical boutique account.
  const sameAs: string[] = [];

  if (sameAsProp && sameAsProp.length > 0) {
    sameAs.push(...sameAsProp.filter(Boolean));
  } else if (instagram) {
    sameAs.push(instagram);
  } else {
    // Add the boutique Instagram account
    sameAs.push("https://www.instagram.com/infinity.color_boutique/");
  }

  // Build contact points array
  const contactPoints: any[] = [
    {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["fa", "Persian"],
      areaServed: "IR",
    },
  ];

  // Add phone contact point if available
  if (phone) {
    contactPoints.push({
      "@type": "ContactPoint",
      contactType: "Customer Service",
      telephone: phone,
      availableLanguage: ["fa", "Persian"],
      areaServed: "IR",
    });
  }

  // Build address object
  const address: any = {
    "@type": "PostalAddress",
    addressCountry: "IR",
    addressLocality: "گرگان",
    addressRegion: "گلستان",
  };

  if (streetAddress) {
    address.streetAddress = streetAddress;
  }

  if (postalCode) {
    address.postalCode = postalCode;
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: name?.trim() || DEFAULT_ORG_NAME,
    alternateName: "Infinitycolor",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/logo_PDF.webp`,
      width: 400,
      height: 400,
    },
    description: description?.trim() || DEFAULT_ORG_DESCRIPTION,
    foundingDate: "2020",
    address,
    sameAs,
    contactPoint: contactPoints.length === 1 ? contactPoints[0] : contactPoints,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/plp?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Add email if provided
  if (email) {
    schema.email = email;
  }

  // Add telephone at organization level if provided
  if (phone) {
    schema.telephone = phone;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
