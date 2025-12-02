import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { categories } from "@/constants/categories";
import PageContainer from "@/components/layout/PageContainer";
import { SITE_NAME, SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها",
  description: `مشاهده تمام دسته‌بندی‌های محصولات ${SITE_NAME}. سریع به دسته مورد نظر بروید و خرید خود را آغاز کنید.`,
  alternates: {
    canonical: `${SITE_URL}/categories`,
  },
  openGraph: {
    title: `دسته‌بندی‌های ${SITE_NAME}`,
    description: `مشاهده تمام دسته‌بندی‌های محصولات ${SITE_NAME}`,
    url: `${SITE_URL}/categories`,
    type: "website",
  },
};

export default function CategoriesPage() {
  return (
    <PageContainer variant="wide" className="space-y-8 pb-16 pt-10">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-foreground-primary lg:text-3xl">
          دسته‌بندی‌های اینفینیتی
        </h1>
        <p className="text-sm text-slate-500 lg:text-base">
          سریع به دسته مورد نظر بروید و خرید خود را آغاز کنید.
        </p>
      </header>

      <section>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/plp?category=${category.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-center transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: `${category.backgroundColor}0f` }}
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-white shadow-sm">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-contain p-4"
                  sizes="96px"
                  loading="lazy"
                />
              </div>
              <span className="text-sm font-medium text-foreground-primary md:text-base">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
