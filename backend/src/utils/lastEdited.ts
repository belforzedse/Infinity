type EntityIdInput =
  | number
  | string
  | null
  | undefined
  | { id?: number | string | null; data?: any };

export function asEntityId(input: EntityIdInput): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string" && input.trim() && Number.isFinite(Number(input))) {
    return Number(input);
  }

  if (input && typeof input === "object") {
    if ("id" in input) return asEntityId((input as any).id);
    if ("data" in input) return asEntityId((input as any).data);
  }

  return null;
}

export async function touchProductLastEdited(productRef: EntityIdInput) {
  const productId = asEntityId(productRef);
  if (!productId) return;

  try {
    await strapi.db.connection("products").where({ id: productId }).update({
      updated_at: new Date(),
    });
  } catch (error: any) {
    strapi.log.warn("[LastEdited] Failed to touch product timestamp", {
      productId,
      error: error?.message || error,
    });
  }
}

export async function touchOrderLastEdited(orderRef: EntityIdInput) {
  const orderId = asEntityId(orderRef);
  if (!orderId) return;

  try {
    await strapi.db.connection("orders").where({ id: orderId }).update({
      updated_at: new Date(),
    });
  } catch (error: any) {
    strapi.log.warn("[LastEdited] Failed to touch order timestamp", {
      orderId,
      error: error?.message || error,
    });
  }
}

export async function touchProductByVariation(variationRef: EntityIdInput) {
  const variationId = asEntityId(variationRef);
  if (!variationId) return;

  const variation = await strapi.db
    .query("api::product-variation.product-variation")
    .findOne({
      where: { id: variationId },
      populate: { product: true },
    });

  await touchProductLastEdited((variation as any)?.product);
}

export async function touchOrderByContract(contractRef: EntityIdInput) {
  const contractId = asEntityId(contractRef);
  if (!contractId) return;

  const contract = await strapi.db.query("api::contract.contract").findOne({
    where: { id: contractId },
    populate: { order: true },
  });

  await touchOrderLastEdited((contract as any)?.order);
}
