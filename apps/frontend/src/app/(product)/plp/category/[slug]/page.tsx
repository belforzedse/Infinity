export const revalidate = 120;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PLPPageView from "../../PLPPageView";
import {
  buildInvalidPLPMetadata,
  buildPLPMetadata,
  getPLPCategoryContext,
  parsePLPQuery,
} from "@/services/product/plp";

interface CategoryPLPPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPLPPage({ params, searchParams }: CategoryPLPPageProps) {
  const { slug } = await params;
  return <PLPPageView categorySlug={slug} searchParams={searchParams} />;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPLPPageProps): Promise<Metadata> {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const query = parsePLPQuery(resolvedSearchParams);
  const category = await getPLPCategoryContext(slug);

  if (!category) {
    notFound();
    return buildInvalidPLPMetadata();
  }

  return buildPLPMetadata(query, category);
}
