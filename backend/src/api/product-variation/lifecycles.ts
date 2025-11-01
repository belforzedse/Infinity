export default {
  models: ["api::product-variation.product-variation"],

  async afterCreate(event, ctx) {
    const { result } = event;

    const product = await strapi.entityService.findOne(
      "api::product-variation.product-variation",
      result.id,
      {
        populate: ["product_stock"],
      }
    );

    if (!product.product_stock) {
      await strapi.entityService.create("api::product-stock.product-stock", {
        data: {
          product_variation: result.id,
          Count: 0,
        },
      });
    }
  },
};
