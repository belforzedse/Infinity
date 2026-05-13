import { Suspense } from "react";
import { connection } from "next/server";
import { Header } from "@/components/Header";
import { HomePostsFeedSection } from "@/components/posts/HomePostsFeedSection";
import { HomePostsCollageSkeleton } from "@/components/posts/HomePostsCollageSkeleton";
import { StoriesRail } from "@/components/StoriesRail";
import { StoriesRailSkeleton } from "@/components/ui/skeletons/StoriesRailSkeleton";
import { getActiveStories } from "@/services/story.service";

export const revalidate = 60;

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
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-10 px-5 pb-6 pt-6 sm:px-6 lg:px-[60px] lg:pb-12">
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
      </main>
    </div>
  );
}
