import { getSocialFeedPosts } from "@repo/social-posts";
import InfinitygramSectionClient from "./InfinitygramSectionClient";

const HOME_INFINITYGRAM_LIMIT = 20;

export default async function InfinitygramSection() {
  const posts = await getSocialFeedPosts({
    limit: HOME_INFINITYGRAM_LIMIT,
    includeRelationCounts: true,
    revalidate: 60,
  });

  if (posts.length === 0) return null;

  return <InfinitygramSectionClient posts={posts} />;
}
