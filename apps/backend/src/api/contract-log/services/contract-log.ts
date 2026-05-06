/**
 * contract-log service
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreService(
  "api::contract-log.contract-log" as any
);
