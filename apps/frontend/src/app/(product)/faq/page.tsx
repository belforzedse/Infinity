import { Metadata } from "next";
import { FAQCategory } from "@/types/faq";
import PageContainer from "@/components/layout/PageContainer";
import FAQPageClient from "@/components/FAQ/FAQPageClient";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import { SITE_URL } from "@/config/site";
import { getSiteFaq } from "@/services/site-faq";
import { getSiteIdentity, resolveSiteName } from "@/services/site-identity";
import type { SiteFaqCategory } from "@/types/site-identity";
import Breadcrumb from "@/components/Kits/Breadcrumb";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";

// Public FAQ is cached and tagged ("faq"); on-demand revalidation refreshes it.
export const revalidate = 3600;

const breadcrumbItems = [
  { label: "صفحه اصلی", href: "/" },
  { label: "سوالات متداول", href: "/faq" },
];

export async function generateMetadata(): Promise<Metadata> {
  const identity = await getSiteIdentity();
  const siteName = resolveSiteName(identity.siteName);

  return {
    title: "سوالات متداول",
    description: `سوالات متداول ${siteName} - پاسخ به سوالات شما درباره محصولات، ارسال، پرداخت و خدمات مشتریان`,
    alternates: {
      canonical: `${SITE_URL}/faq`,
    },
    openGraph: {
      title: `سوالات متداول - ${siteName}`,
      description: `پاسخ به سوالات متداول درباره محصولات، ارسال، پرداخت و خدمات مشتریان`,
      url: `${SITE_URL}/faq`,
      siteName,
      type: "website",
    },
  };
}

/**
 * Map the `site-faq` single-type shape into the legacy `FAQCategory[]` shape the
 * FAQ client components already consume. Ids/dates are synthesized; the data is
 * read-only on the storefront so synthetic ids are safe and stable per render.
 */
function mapSiteFaqToCategories(categories: SiteFaqCategory[]): FAQCategory[] {
  return categories.map((category, categoryIndex) => ({
    id: categoryIndex + 1,
    Title: category.title,
    Slug: `faq-category-${categoryIndex + 1}`,
    Description: category.description,
    Order: category.order ?? categoryIndex,
    createdAt: "",
    updatedAt: "",
    faq_questions: (category.items || []).map((item, itemIndex) => ({
      id: (categoryIndex + 1) * 1000 + itemIndex + 1,
      Question: item.question,
      Answer: item.answer,
      Order: item.order ?? itemIndex,
      IsActive: item.isActive !== false,
      createdAt: "",
      updatedAt: "",
    })),
  }));
}

export default async function FAQPage() {
  const siteFaq = await getSiteFaq();
  const categories = mapSiteFaqToCategories(siteFaq.categories);

  // Prepare FAQ schema data
  const faqSchemaData = categories.flatMap((category) =>
    (category.faq_questions || [])
      .filter((q) => q.IsActive)
      .map((q) => ({
        question: q.Question,
        answer: q.Answer.replace(/<[^>]*>/g, ""), // Strip HTML for schema
      }))
  );

  // Get first category as default
  const defaultCategory = categories.length > 0 ? categories[0] : null;

  return (
    <>
      <BreadcrumbSchema breadcrumbs={breadcrumbItems} />
      <PageContainer variant="wide" className="space-y-6 pb-20 pt-8" dir="rtl">
        {/* FAQ Schema for SEO */}
        {faqSchemaData.length > 0 && <FAQSchema faqs={faqSchemaData} />}

        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground-primary lg:text-4xl">
            اگه براتون سواله
          </h1>
          <Breadcrumb breadcrumbs={breadcrumbItems} />
        </div>

        {/* Main Content */}
        <FAQPageClient
          categories={categories}
          defaultCategory={defaultCategory}
        />
      </PageContainer>
    </>
  );
}
