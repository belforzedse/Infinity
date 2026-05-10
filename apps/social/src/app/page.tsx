import { connection } from "next/server";
import { Header } from "@/components/Header";
import { StoriesRail } from "@/components/stories-rail";
import { getActiveStories } from "@/services/story.service";

export const revalidate = 60;

async function getStoriesForHome() {
  try {
    return await getActiveStories();
  } catch (error) {
    console.error("Error fetching active stories:", error);
    return [];
  }
}

export default async function HomePage() {
  await connection();

  const activeStories = await getStoriesForHome();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-6 pt-6 sm:px-6 lg:px-[60px] lg:pb-12">
        {activeStories.length > 0 && (
          <section>
            <StoriesRail stories={activeStories} />
          </section>
        )}
      </main>
    </div>
  );
}
