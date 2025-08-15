/**
 * contract-log router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter(
  "api::contract-log.contract-log" as any
);
