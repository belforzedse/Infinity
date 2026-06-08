export default function InfinitygramSectionSkeleton() {
  return (
    <section
      dir="rtl"
      className="overflow-hidden rounded-none bg-[#252220] px-3 py-8 sm:rounded-lg sm:px-6 lg:px-8 lg:py-10"
      aria-busy="true"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="skeleton-shimmer h-8 w-64 rounded-md bg-white/15" />
        <div className="hidden h-5 w-36 rounded-md bg-white/10 sm:block" />
      </div>
      <div className="hidden grid-cols-12 grid-rows-2 gap-x-2 gap-y-2 lg:grid">
        <div className="col-span-2 row-start-1 aspect-[184/229] rounded-[20px] bg-white/10" />
        <div className="col-span-2 row-start-2 aspect-[184/229] rounded-[20px] bg-white/10" />
        <div className="col-span-3 row-span-2 aspect-[383/536] rounded-[20px] bg-white/10" />
        <div className="col-span-2 row-start-1 aspect-[184/229] rounded-[20px] bg-white/10" />
        <div className="col-span-2 row-start-2 aspect-[184/229] rounded-[20px] bg-white/10" />
        <div className="col-span-2 row-start-1 aspect-[184/229] rounded-[20px] bg-white/10" />
        <div className="col-span-2 row-start-2 aspect-[184/229] rounded-[20px] bg-white/10" />
        <div className="col-span-3 row-span-2 aspect-[383/536] rounded-[20px] bg-white/10" />
      </div>
      <div className="flex gap-3 overflow-hidden lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 w-40 shrink-0 rounded-[20px] bg-white/10" />
        ))}
      </div>
    </section>
  );
}
