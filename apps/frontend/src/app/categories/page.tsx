import type { Metadata } from "next";
import PageContainer from "@/components/layout/PageContainer";
import { StorefrontGrid } from "@/components/storefront";
import CategoryCard from "@/components/Categories/CategoryCard";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { getProductCategories } from "@/services/product/categories";

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

export default async function CategoriesPage() {
  const categories = await getProductCategories({
    parentOnly: true,
    sort: "Title:asc",
    revalidate: 60,
  });

  return (
    <PageContainer variant="wide" className="space-y-8 pb-16 pt-10">
      <header className="space-y-2 text-center">
        <h1 className="text-foreground-primary text-2xl font-semibold lg:text-3xl">
          دسته‌بندی‌های اینفینیتی
        </h1>
        <p className="text-sm text-slate-500 lg:text-base">
          سریع به دسته مورد نظر بروید و خرید خود را آغاز کنید.
        </p>
      </header>

      <section>
        {categories.length > 0 ? (
          <StorefrontGrid variant="categories">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} size="carousel" />
            ))}
          </StorefrontGrid>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            دسته‌بندی برای نمایش وجود ندارد.
          </div>
        )}
      </section>
    </PageContainer>
  );
}
