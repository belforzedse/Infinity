import Link from "next/link";
import { Metadata } from "next";
import PageContainer from "@/components/layout/PageContainer";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { API_BASE_URL, ENDPOINTS } from "@/constants/api";

interface Category {
  Id: number;
  Title: string;
  Slug: string;
}

interface StrapiCategoryEntry {
  id: number;
  attributes: {
    Title: string;
    Slug?: string | null;
  };
}

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

async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PRODUCT.CATEGORY}?pagination[limit]=-1`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    if (Array.isArray(data.data) && data.data.length > 0) {
      const categoryEntries = data.data as StrapiCategoryEntry[];
      return categoryEntries
        .slice(0, 6)
        .map((cat: StrapiCategoryEntry): Category => ({
          Id: cat.id,
          Title: cat.attributes.Title,
          Slug: cat.attributes.Slug || cat.id.toString(),
        }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

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
        {categories.length === 0 ? (
          <div className="text-center text-slate-500">در حال بارگذاری دسته‌بندی‌ها...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.Id}
                href={`/plp?category=${category.Slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-center transition-transform hover:-translate-y-0.5"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
                  <span className="text-3xl">📦</span>
                </div>
                <span className="text-sm font-medium text-foreground-primary md:text-base">
                  {category.Title}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
