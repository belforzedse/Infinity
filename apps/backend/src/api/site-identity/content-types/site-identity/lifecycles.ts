import { triggerFrontendRevalidation } from "../../../../utils/revalidate";

export default {
  async afterUpdate() {
    await triggerFrontendRevalidation({ type: "site-identity" }, "Site Identity Lifecycle");
  },
};
