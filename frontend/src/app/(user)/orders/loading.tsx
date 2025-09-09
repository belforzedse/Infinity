import OrderCardSkeleton from "@/components/User/Orders/OrderCardSkeleton";
import OrderRowSkeleton from "@/components/User/Orders/OrderRowSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto flex min-h-[60vh] gap-10 bg-white px-4 lg:p-0" dir="rtl">
      {/* Sidebar placeholder space to avoid big layout shift */}
      <div className="mr-1 hidden w-[240px] flex-col gap-4 rounded-lg bg-white lg:flex">
        <div className="h-8" />
      </div>

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto">
        <div className="h-10 w-72 rounded-lg bg-slate-100" />

        <div className="flex w-full flex-col gap-8 lg:flex-row lg:gap-5">
          {/* Mobile skeletons */}
          <div className="w-full lg:hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>

          {/* Desktop skeleton rows */}
          <div className="hidden w-full overflow-x-auto lg:flex">
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 6 }).map((_, i) => (
                  <OrderRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

