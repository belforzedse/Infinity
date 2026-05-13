import { Header } from "@/components/Header";
import { SearchEmptySkeleton } from "@/components/ui/skeletons/SearchEmptySkeleton";

export default function SearchLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-5 pb-6 pt-6 sm:px-6 lg:px-[60px] lg:pb-12">
        <SearchEmptySkeleton />
      </main>
    </div>
  );
}
