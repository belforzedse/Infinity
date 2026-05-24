import { Metadata } from "next";
import { notFound } from "next/navigation";
import { faqService } from "@/services/faq/faq.service";
import { FAQCategory } from "@/types/faq";
import PageContainer from "@/components/layout/PageContainer";
import FAQPageClient from "@/components/FAQ/FAQPageClient";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import logger from "@/utils/logger";
import { SITE_NAME, SITE_URL } from "@/config/site";
import Breadcrumb from "@/components/Kits/Breadcrumb";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";

export const revalidate = 60; // Revalidate every minute

const breadcrumbItems = [
  { label: "صفحه اصلی", href: "/" },
  { label: "سوالات متداول", href: "/faq" },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "سوالات متداول",
    description: `سوالات متداول ${SITE_NAME} - پاسخ به سوالات شما درباره محصولات، ارسال، پرداخت و خدمات مشتریان`,
    alternates: {
      canonical: `${SITE_URL}/faq`,
    },
    openGraph: {
      title: `سوالات متداول - ${SITE_NAME}`,
      description: `پاسخ به سوالات متداول درباره محصولات، ارسال، پرداخت و خدمات مشتریان`,
      url: `${SITE_URL}/faq`,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function FAQPage() {
  let categories: FAQCategory[] = [];

  try {
    const response = await faqService.getFAQCategories();
    categories = response.data || [];

    if (categories.length === 0) {
      logger.warn("[FAQ] No FAQ categories found");
    }
  } catch (error) {
    logger.error("[FAQ] Error fetching FAQ categories", { error });
    notFound();
  }

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
