import {
  isPurchasableVariation,
  type VariationAvailabilityInput,
} from "./productAvailability";

export const isVariationInStock = (
  variation: VariationAvailabilityInput | null | undefined,
): boolean => isPurchasableVariation(variation);
