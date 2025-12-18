/**
 * Formats product image URLs from Strapi attributes
 * @param product Product object with attributes
 * @param includeMedia Whether to include additional media images (usually for desktop)
 * @param baseUrl Base URL for images
 * @returns Array of filtered image URLs
 */
export function getProductImages(product: any, includeMedia: boolean, baseUrl: string): string[] {
  const coverImageUrl = product.attributes?.CoverImage?.data?.attributes?.url
    ? `${baseUrl}${product.attributes.CoverImage.data.attributes.url}`
    : "";

  const mediaImages =
    includeMedia && product.attributes?.Media?.data
      ? product.attributes.Media.data
          .filter((m: any) => m.attributes?.mime?.startsWith("image/") && m.attributes?.url)
          .map((m: any) => `${baseUrl}${m.attributes.url}`)
      : [];

  return [coverImageUrl, ...mediaImages].filter(Boolean);
}

