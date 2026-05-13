import { getHomeDemoPosts, isSocialHomePostsDemoEnabled } from "@/components/posts/home-posts-demo";
import { HomePostsCollage } from "@/components/posts/HomePostsCollage";
import { getHomeFeedPosts } from "@/services/feed-post.service";

/**
 * Async island for `<Suspense>` — renders [`HomePostsCollage`](./HomePostsCollage.tsx).
 * Set **`NEXT_PUBLIC_SOCIAL_HOME_POSTS_DEMO=true`** (or `1` / `yes`) to use Picsum placeholders instead of **`GET /posts`**.
 */
export async function HomePostsFeedSection() {
  const posts = isSocialHomePostsDemoEnabled() ? getHomeDemoPosts() : await getHomeFeedPosts();
  return <HomePostsCollage posts={posts} likeMode="api" />;
}
