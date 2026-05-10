import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: "خانه", href: "/", active: true },
  { label: "کاوش", href: "#explore" },
  { label: "پیام‌ها", href: "#messages" },
  { label: "اعلان‌ها", href: "#notifications" },
];

function navItemClassName(active?: boolean): string {
  return active
    ? "rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
    : "rounded-full px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900";
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-[60px]">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900"
        >
          اینفینیتی‌گرام
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="ناوبری اصلی">
          {navItems.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.label}
                href={item.href}
                className={navItemClassName(item.active)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className={navItemClassName(item.active)}
              >
                {item.label}
              </a>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="hidden h-9 max-w-[200px] flex-1 items-center rounded-full border border-zinc-200 bg-white px-4 text-right text-sm text-zinc-500 shadow-sm sm:flex md:max-w-[240px]"
            aria-label="جستجو"
          >
            جستجو…
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 md:hidden"
            aria-label="منو"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            className="hidden h-9 items-center justify-center rounded-full bg-violet-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 md:inline-flex"
          >
            پست جدید
          </button>
        </div>
      </div>
    </header>
  );
}

function FeedPlaceholder() {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="size-11 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-900">تیم محصول</span>
            <span className="text-sm text-zinc-500">· همین الان</span>
          </div>
          <p className="text-[15px] leading-7 text-zinc-700">
            به اینفینیتی‌گرام خوش آمدید. این اولین اسکلت صفحهٔ اصلی است — فید،
            پروفایل و API را در همین چارچوب گسترش می‌دهیم.
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-3 py-1">نمونهٔ کارت</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">آمادهٔ اتصال</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ComposerPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-4 text-center text-sm text-zinc-500">
      ناحیهٔ «چه خبر؟» — فرم ساخت پست اینجا قرار می‌گیرد.
    </div>
  );
}

function SideRail() {
  return (
    <aside className="space-y-4 lg:sticky lg:top-[4.5rem] lg:self-start">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">پیشنهادها</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          بعد از اتصال به API، لیست کاربران و موضوعات داغ اینجا نمایش داده
          می‌شود.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">روندها</h2>
        <ul className="mt-3 space-y-2 text-sm text-violet-700">
          <li>#اینفینیتی</li>
          <li>#شروع_توسعه</li>
        </ul>
      </div>
    </aside>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-[60px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
          <div className="space-y-6">
            <ComposerPlaceholder />
            <FeedPlaceholder />
            <FeedPlaceholder />
          </div>
          <div className="hidden lg:block">
            <SideRail />
          </div>
        </div>
      </div>
    </div>
  );
}
