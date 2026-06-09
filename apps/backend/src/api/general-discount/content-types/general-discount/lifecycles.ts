import { scheduleHomeProductsRevalidation } from "../../../../utils/homepageRevalidation";

export default {
  async afterCreate(event) {
    scheduleHomeProductsRevalidation("general-discount-create", {
      discountId: event?.result?.id,
    });
  },

  async afterUpdate(event) {
    scheduleHomeProductsRevalidation("general-discount-update", {
      discountId: event?.result?.id,
    });
  },

  async afterDelete(event) {
    scheduleHomeProductsRevalidation("general-discount-delete", {
      discountId: event?.result?.id ?? event?.params?.where?.id,
    });
  },
};
