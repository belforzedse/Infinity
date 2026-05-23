export const revalidate = 120;

import type { Metadata } from "next";
import PLPPageView from "./PLPPageView";
import {
  buildInvalidPLPMetadata,
  buildPLPMetadata,
  getPLPCategoryContext,
  parsePLPQuery,
} from "@/services/product/plp";

interface PLPPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function PLPPage({ searchParams }: PLPPageProps) {
  return <PLPPageView searchParams={searchParams} />;
}

export async function generateMetadata({ searchParams }: PLPPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = parsePLPQuery(params);

  if (query.category) {
    const category = await getPLPCategoryContext(query.category);
    return category ? buildPLPMetadata(query, category) : buildInvalidPLPMetadata();
  }

  return buildPLPMetadata(query);
}
