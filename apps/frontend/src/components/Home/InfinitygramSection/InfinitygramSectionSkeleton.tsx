export default function InfinitygramSectionSkeleton() {
  const desktopCells = [
    "col-span-1 row-span-1 aspect-[184/229]",
    "col-span-1 row-span-1 aspect-[184/229]",
    "col-span-2 row-span-2 aspect-[383/536]",
    "col-span-1 row-span-1 aspect-[184/229]",
    "col-span-1 row-span-1 aspect-[184/229]",
    "col-span-1 row-span-1 aspect-[184/229]",
    "col-span-1 row-span-1 aspect-[184/229]",
    "col-span-2 row-span-2 aspect-[383/536]",
  ];

  const mobileCells = [
    "col-span-1 aspect-[184/229]",
    "col-span-2 aspect-[362/484] sm:row-span-2",
    "col-span-1 aspect-[184/229]",
    "col-span-1 aspect-[184/229]",
    "col-span-1 aspect-[184/229]",
    "col-span-2 aspect-[362/484] sm:row-span-2",
  ];

  return (
    <section
      dir="rtl"
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#252220]"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-[1360px] px-2 py-8 sm:px-5 lg:px-[60px] lg:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="skeleton-shimmer h-8 w-64 rounded-md bg-white/15" />
          <div className="hidden h-5 w-36 rounded-md bg-white/10 sm:block" />
        </div>

        <div
          className="hidden w-full min-w-0 grid-flow-dense grid-cols-6 gap-x-1.5 gap-y-2 lg:grid"
          dir="ltr"
        >
          {desktopCells.map((cellClass, index) => (
            <div key={index} className={`${cellClass} min-w-0 rounded-[20px] bg-white/10`} />
          ))}
        </div>

        <div
          className="grid w-full min-w-0 grid-flow-dense grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-3 md:grid-cols-4 min-[900px]:grid-cols-5 lg:hidden"
          dir="ltr"
        >
          {mobileCells.map((cellClass, index) => (
            <div key={index} className={`${cellClass} min-w-0 rounded-[20px] bg-white/10`} />
          ))}
        </div>
      </div>
    </section>
  );
}
