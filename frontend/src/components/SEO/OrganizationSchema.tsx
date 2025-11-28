const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "https://api.infinitycolor.org";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "اینفینیتی استور",
    alternateName: "Infinity Store",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${IMAGE_BASE_URL}/uploads/logo_5a5e2f8a4d.png`,
      width: 400,
      height: 400,
    },
    description: "فروشگاه پوشاک آنلاین اینفینیتی - جدیدترین محصولات، تخفیف‌ها و پیشنهادهای ویژه",
    foundingDate: "2020",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IR",
      addressLocality: "تهران",
      addressRegion: "تهران",
    },
    sameAs: [
      "https://www.instagram.com/infinitycolor",
      "https://www.telegram.org/t.me/infinitycolor",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["fa", "Persian"],
      areaServed: "IR",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/plp?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
