import Image from "next/image";

export const EmptyState = () => (
  <div className="lg:border border-slate-100 rounded-xl flex flex-col gap-3 items-center justify-center h-full">
    <Image
      src="/images/EmptyListIcon.svg"
      alt="empty-state"
      width={180}
      height={122}
    />
    <span className="text-slate-400 text-base">
      هنوز تراکنشی برای نمایش وجود ندارد!
    </span>
  </div>
);
