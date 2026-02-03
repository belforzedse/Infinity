import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import PageContainer from "@/components/layout/PageContainer";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { getProductCategories } from "@/services/product/categories";
import { CATEGORY_IMAGE_PLACEHOLDER } from "@/constants/placeholders";

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

const getSoftBackground = (color?: string | null) => {
  const trimmed = color?.trim();
  if (!trimmed) return "#f8fafc";
  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
    return `${trimmed}0f`;
  }
  return trimmed;
};

export default async function CategoriesPage() {
  const categories = await getProductCategories({ parentOnly: true, sort: "Title:asc" });

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
        {categories.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-6">
            {categories.map((category) => {
              const imageSrc = category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER;
              const label = category.name || category.slug;
              const bgColor = getSoftBackground(category.color);

              return (
                <Link
                  key={category.id}
                  href={{ pathname: "/plp", query: { category: category.slug } }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-center transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-full bg-white shadow-sm">
                    <Image
                      src={imageSrc}
                      alt={category.imageAlt || label}
                      fill
                      className="object-contain p-4"
                      sizes="96px"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground-primary md:text-base">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            دسته‌بندی برای نمایش وجود ندارد.
          </div>
        )}
      </section>
    </PageContainer>
  );
}
