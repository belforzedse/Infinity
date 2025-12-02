interface ProductItem {
  id: number;
  title: string;
  url: string;
  image?: string;
  price?: number;
  currency?: string;
}

interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  items: ProductItem[];
  itemCount?: number;
}

export function CollectionPageSchema({
  name,
  description,
  url,
  items,
  itemCount,
}: CollectionPageSchemaProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://infinitycolor.org";

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemCount || items.length,
      itemListElement: items.slice(0, 20).map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: item.title,
          url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
          ...(item.image && {
            image: item.image.startsWith("http") ? item.image : `${SITE_URL}${item.image}`,
          }),
          ...(item.price && {
            offers: {
              "@type": "Offer",
              price: item.price.toString(),
              priceCurrency: item.currency || "IRR",
            },
          }),
        },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}



