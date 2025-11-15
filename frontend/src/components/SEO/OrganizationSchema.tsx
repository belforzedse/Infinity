export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "اینفینیتی استور",
    url: "https://infinitycolor.org",
    logo: "https://api.infinitycolor.org/uploads/logo_5a5e2f8a4d.png",
    description: "فروشگاه پوشاک آنلاین اینفینیتی",
    sameAs: [
      "https://www.instagram.com/infinitycolor",
      "https://www.telegram.org",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: "fa",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
