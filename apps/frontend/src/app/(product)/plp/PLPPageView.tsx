import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import PLPHeroBanner from "@/components/PLP/HeroBanner";
import PLPList from "@/components/PLP/List";
import PageContainer from "@/components/layout/PageContainer";
import ProductListSkeleton from "@/components/Skeletons/ProductListSkeleton";
import AsyncSidebarProducts from "@/components/PLP/List/AsyncSidebarProducts";
import { SkeletonBlock } from "@repo/ui/skeleton";
import { CollectionPageSchema } from "@/components/SEO/CollectionPageSchema";
import type { PLPProduct as PLPListProduct } from "@/components/PLP/types";
import {
  buildCollectionItems,
  buildPLPPageCopy,
  getPLPCategoryContext,
  getPLPProducts,
  parsePLPQuery,
} from "@/services/product/plp";
import { getCategoryPlpHrefWithQuery } from "@/utils/plpRoutes";
import logger from "@/utils/logger";

interface PLPPageViewProps {
  categorySlug?: string;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function toURLSearchParams(params: { [key: string]: string | string[] | undefined }) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
    } else if (typeof value === "string") {
      searchParams.set(key, value);
    }
  }
  return searchParams;
}

export default async function PLPPageView({ categorySlug, searchParams }: PLPPageViewProps) {
  await connection();
  const params = await searchParams;
  const query = parsePLPQuery(params);

  if (!categorySlug && query.category) {
    const legacyCategory = await getPLPCategoryContext(query.category);
    if (!legacyCategory) {
      logger.warn(`[PLP] Invalid or non-existent category requested: ${query.category}`);
      notFound();
    }
    redirect(
      getCategoryPlpHrefWithQuery(legacyCategory.slug, toURLSearchParams(params), {
        resetPage: false,
      }),
    );
  }

  const categoryContext = categorySlug
    ? await getPLPCategoryContext(categorySlug)
    : undefined;

  if (categorySlug && !categoryContext) {
    logger.warn(`[PLP] Invalid or non-existent category requested: ${categorySlug}`);
    notFound();
  }

  const resolvedCategoryContext = categoryContext ?? undefined;
  const { products, pagination } = await getPLPProducts(
    query,
    resolvedCategoryContext?.categorySlugs,
    30,
  );
  const sidebarSlot = (
    <Suspense
      fallback={
        <div className="flex flex-col gap-7">
          <SkeletonBlock tone="light" className="h-20 rounded" />
          <SkeletonBlock tone="light" className="h-20 rounded" />
        </div>
      }
    >
      <AsyncSidebarProducts />
    </Suspense>
  );

  const { pageName, pageDescription, url } = buildPLPPageCopy(query, resolvedCategoryContext);
  const collectionItems = buildCollectionItems(products);

  return (
    <PageContainer className="space-y-6 pb-20 pt-6">
      {products.length > 0 && (
        <CollectionPageSchema
          name={pageName}
          description={pageDescription}
          url={url}
          items={collectionItems}
          itemCount={pagination.total}
        />
      )}

      {!query.search && <PLPHeroBanner category={resolvedCategoryContext?.slug} />}

      <Suspense fallback={<ProductListSkeleton />}>
        <PLPList
          products={products as PLPListProduct[]}
          pagination={pagination}
          category={resolvedCategoryContext?.slug}
          allCategories={resolvedCategoryContext?.allCategories ?? []}
          searchQuery={query.search}
          sidebarSlot={sidebarSlot}
        />
      </Suspense>
    </PageContainer>
  );
}
