import { Header } from "@/components/Header";

export default function ProfilePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-6 pt-6 sm:px-6 lg:px-[60px] lg:pb-12">
        <h1 className="font-peyda text-lg font-semibold text-zinc-800">
          پروفایل
        </h1>
      </main>
    </div>
  );
}
