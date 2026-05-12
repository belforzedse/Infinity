import { Header } from "@/components/Header";
import SuspenseLoader from "@/components/ui/SuspenseLoader";

export default function PostDetailLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 items-center justify-center px-4 py-12">
        <SuspenseLoader />
      </main>
    </div>
  );
}
