export default {
  models: ["api::product.product"],

  async afterCreate(event, ctx) {
    const { result } = event;

    const product = await strapi.entityService.findOne(
      "api::product.product",
      result.id,
      {
        populate: ["product_size_helper"],
      }
    );

    if (!product.product_size_helper) {
      await strapi.entityService.create(
        "api::product-size-helper.product-size-helper",
        {
          data: {
            product: result.id,
            Helper: {},
          },
        }
      );
    }
  },
};
