import { scheduleHomeProductsRevalidation } from "../../../../utils/homepageRevalidation";

export default {
  async afterCreate(event) {
    scheduleHomeProductsRevalidation("discount-create", {
      discountId: event?.result?.id,
    });
  },

  async afterUpdate(event) {
    scheduleHomeProductsRevalidation("discount-update", {
      discountId: event?.result?.id,
    });
  },

  async afterDelete(event) {
    scheduleHomeProductsRevalidation("discount-delete", {
      discountId: event?.result?.id ?? event?.params?.where?.id,
    });
  },
};
