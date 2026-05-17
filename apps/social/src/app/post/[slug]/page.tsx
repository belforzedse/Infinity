import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { StoriesRail } from "@/components/StoriesRail";
import { PostDetailBackButton } from "@/components/posts/PostDetailBackButton";
import { PostDetailRelatedLayout } from "@/components/posts/PostDetailRelatedLayout";
import { getHomeDemoPosts, isSocialHomePostsDemoEnabled } from "@/components/posts/home-posts-demo";
import { getHomeFeedPosts } from "@/services/feed-post.service";
import { getPostDetailBySlug } from "@/services/post-detail.service";
import { getActiveStories } from "@/services/story.service";
import { SITE_NAME, SITE_URL } from "@/config/site";

export const revalidate = 10;

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
      title: "پست یافت نشد",
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/post/${encodeURIComponent(post.slug)}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const previewImage = post.media[0]?.url;

  return {
    title: post.title,
    description: post.caption,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${post.title} | ${SITE_NAME}`,
      description: post.caption,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "fa_IR",
      type: "article",
      images: previewImage ? [{ url: previewImage }] : undefined,
    },
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

        <div className="flex w-full flex-row items-center justify-between gap-3">
          <h1 className="font-peyda min-w-0 flex-1 truncate text-start text-lg font-semibold leading-[21px] text-[#424242]">
            {post.title}
          </h1>
          <div className="hidden lg:block">
            <PostDetailBackButton />
          </div>
        </div>

        <div className="post-page-drawer-enter">
          <PostDetailRelatedLayout post={post} relatedPosts={relatedPosts} />
        </div>
      </main>
    </div>
  );
}
