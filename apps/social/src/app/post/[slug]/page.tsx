import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { StoriesRail } from "@/components/StoriesRail";
import { HomePostsCollage } from "@/components/posts/HomePostsCollage";
import { PostDetailView } from "@/components/posts/PostDetailView";
import { getHomeDemoPosts, isSocialHomePostsDemoEnabled } from "@/components/posts/home-posts-demo";
import { getHomeFeedPosts } from "@/services/feed-post.service";
import { getPostDetailBySlug } from "@/services/post-detail.service";
import { getActiveStories } from "@/services/story.service";

export const revalidate = 30;

type PostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function getGridPosts() {
  try {
    return isSocialHomePostsDemoEnabled() ? getHomeDemoPosts() : await getHomeFeedPosts();
  } catch (error) {
    console.error("Post detail grid fetch failed:", error);
    return [];
  }
}

async function getStoriesForPost() {
  try {
    return await getActiveStories();
  } catch (error) {
    console.error("Post detail stories fetch failed:", error);
    return [];
  }
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostDetailBySlug(safeDecode(slug));

  if (!post) {
    return {
      title: "پست یافت نشد | اینفینیتی‌گرام",
    };
  }

  return {
    title: `${post.title} | اینفینیتی‌گرام`,
    description: post.caption,
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params;
  const [post, gridPosts, activeStories] = await Promise.all([
    getPostDetailBySlug(safeDecode(slug)),
    getGridPosts(),
    getStoriesForPost(),
  ]);

  if (!post) notFound();

  const relatedPosts = gridPosts.filter((item) => item.slug !== post.slug);
  const sidePosts = relatedPosts.slice(0, 6);
  const lowerPosts = relatedPosts.slice(6);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main
        className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 pb-8 pt-3 sm:px-6 lg:px-[60px] lg:pb-12 lg:pt-6"
        dir="rtl"
      >
        {activeStories.length > 0 ? (
          <section>
            <StoriesRail stories={activeStories} />
          </section>
        ) : null}

        <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full min-w-0 lg:w-[560px] lg:shrink-0">
            <PostDetailView post={post} />
          </aside>

          <section
            className="hidden min-w-0 flex-1 lg:block"
            aria-label="پست‌های دیگر"
          >
            <HomePostsCollage
              posts={sidePosts}
              desktopLayout="compact"
              likeMode="api"
            />
          </section>
        </div>

        {lowerPosts.length > 0 ? (
          <section aria-label="پست‌های بیشتر">
            <HomePostsCollage posts={lowerPosts} likeMode="api" showHeading={false} />
          </section>
        ) : null}
      </main>
    </div>
  );
}
