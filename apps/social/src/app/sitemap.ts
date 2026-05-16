import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { getHomeFeedPosts } from "@/services/feed-post.service";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getHomeFeedPosts();
  const postEntries = Array.from(new Map(posts.map((post) => [post.slug, post])).values()).map(
    (post) => ({
      url: `${SITE_URL}/post/${encodeURIComponent(post.slug)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }),
  );

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...postEntries,
  ];
}
