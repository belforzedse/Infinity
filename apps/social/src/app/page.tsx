import { Suspense } from "react";
import { connection } from "next/server";
import { Header } from "@/components/Header";
import { HomePostsFeedSection } from "@/components/posts/HomePostsFeedSection";
import { HomePostsCollageSkeleton } from "@/components/posts/HomePostsCollageSkeleton";
import { StoriesRail } from "@/components/StoriesRail";
import { StoriesRailSkeleton } from "@/components/ui/skeletons/StoriesRailSkeleton";
import { getActiveStories } from "@/services/story.service";
import { SocialContainer } from "@/components/SocialContainer";

export const revalidate = 10;

async function HomeBody() {
  await connection();

  let activeStories: Awaited<ReturnType<typeof getActiveStories>> = [];
  try {
    activeStories = await getActiveStories();
  } catch (error) {
    console.error("Error fetching active stories:", error);
  }

  return (
    <>
      {activeStories.length > 0 ? (
        <section>
          <StoriesRail stories={activeStories} />
        </section>
      ) : null}
      <section>
        <Suspense fallback={<HomePostsCollageSkeleton />}>
          <HomePostsFeedSection />
        </Suspense>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <SocialContainer as="main" className="flex flex-1 flex-col gap-10 pb-6 pt-6 lg:pb-12">
        <Suspense
          fallback={
            <>
              <section>
                <StoriesRailSkeleton />
              </section>
              <section>
                <HomePostsCollageSkeleton />
              </section>
            </>
          }
        >
          <HomeBody />
        </Suspense>
      </SocialContainer>
    </div>
  );
}
