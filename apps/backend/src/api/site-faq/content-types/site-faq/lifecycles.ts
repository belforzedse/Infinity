import { triggerFrontendRevalidation } from "../../../../utils/revalidate";

export default {
  async afterUpdate() {
    await triggerFrontendRevalidation({ type: "faq" }, "Site FAQ Lifecycle");
  },
};
