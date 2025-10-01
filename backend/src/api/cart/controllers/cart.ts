/**
 * cart controller
 */

import { factories } from "@strapi/strapi";
import { Strapi } from "@strapi/strapi";
import { applyDiscountHandler } from "./handlers/applyDiscount";
import { getMyCartHandler } from "./handlers/getMyCart";
import { addItemHandler } from "./handlers/addItem";
import { updateItemHandler } from "./handlers/updateItem";
import { removeItemHandler } from "./handlers/removeItem";
import { checkStockHandler } from "./handlers/checkStock";
import { finalizeToOrderHandler } from "./handlers/finalizeToOrder";
import { shippingPreviewHandler } from "./handlers/shippingPreview";

export default factories.createCoreController(
  "api::cart.cart",
  ({ strapi }: { strapi: Strapi }) => ({
    async applyDiscount(ctx) {
      return applyDiscountHandler(strapi)(ctx);
    },

    async getMyCart(ctx) {
      return getMyCartHandler(strapi)(ctx);
    },

    async addItem(ctx) {
      return addItemHandler(strapi)(ctx);
    },

    async updateItem(ctx) {
      return updateItemHandler(strapi)(ctx);
    },

    async removeItem(ctx) {
      return removeItemHandler(strapi)(ctx);
    },

    async checkStock(ctx) {
      return checkStockHandler(strapi)(ctx);
    },

    async finalizeToOrder(ctx) {
      return finalizeToOrderHandler(strapi)(ctx);
    },

    async shippingPreview(ctx) {
      return shippingPreviewHandler(strapi)(ctx);
    },
  })
);
