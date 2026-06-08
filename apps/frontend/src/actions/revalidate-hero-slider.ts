"use server";

import { revalidateTag } from "next/cache";

export async function revalidateHeroSliderCache() {
  revalidateTag("hero-slider", "max");
}
