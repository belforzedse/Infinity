import { getHomeFeedPosts, type HomeFeedPost } from "@/services/feed-post.service";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("fa-IR");
}

function searchableText(post: HomeFeedPost): string {
  return [
    post.title,
    post.slug,
    post.imageAlt,
    ...post.media.map((item) => item.alternativeText ?? ""),
  ]
    .join(" ")
    .toLocaleLowerCase("fa-IR");
}

export async function searchPosts(query: string): Promise<readonly HomeFeedPost[]> {
  const q = normalize(query);
  if (!q) return [];

  // TODO: server search - replace this client-side filter when the posts API exposes a search endpoint.
  const posts = await getHomeFeedPosts();
  return posts.filter((post) => searchableText(post).includes(q));
}
