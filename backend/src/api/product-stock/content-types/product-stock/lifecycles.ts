export default {
  async afterCreate(event) {
    const { result } = event;

    // Log initial stock if non-zero
    const initialCount = result?.Count ?? 0;
    if (result?.id && initialCount > 0) {
      await strapi.entityService.create(
        "api::product-stock-log.product-stock-log",
        {
          data: {
            product_stock: result.id,
            Count: initialCount,
            Type: "Add",
            Description: "Initial stock",
          },
        }
      );
    }
  },

  async beforeUpdate(event) {
    // Capture previous Count for delta calculation
    const where = event?.params?.where || {};
    const id = (where && (where.id || where.documentId)) || null;
    if (!id) return;

    const existing = await strapi.entityService.findOne(
      "api::product-stock.product-stock",
      id,
      { fields: ["Count"] }
    );

    event.state = {
      ...(event.state || {}),
      previousCount: existing?.Count ?? 0,
    };
  },

  async afterUpdate(event) {
    const { result, state } = event as any;
    const previous = state?.previousCount;
    const current = result?.Count;

    if (typeof previous !== "number" || typeof current !== "number") return;
    if (!result?.id || previous === current) return;

    const delta = Math.abs(current - previous);
    const type = current > previous ? "Add" : "Minus";

    await strapi.entityService.create(
      "api::product-stock-log.product-stock-log",
      {
        data: {
          product_stock: result.id,
          Count: delta,
          Type: type,
          Description: "Stock updated",
        },
      }
    );
  },
};
