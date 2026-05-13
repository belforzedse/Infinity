"use client";

import { HomePostsCollage } from "@/components/posts/HomePostsCollage";
import type { HomeFeedPost } from "@/services/feed-post.service";

export function SearchResultsGrid({ posts }: { posts: readonly HomeFeedPost[] }) {
  return <HomePostsCollage posts={posts} likeMode="api" showHeading={false} />;
}
