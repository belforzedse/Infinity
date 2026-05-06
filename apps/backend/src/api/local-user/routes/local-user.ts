/**
 * local-user router
 */

import { factories } from "@strapi/strapi";
import { MANAGEMENT_ROLES } from "../../../utils/roles";

const adminPolicy = [
  {
    name: "global::role-based",
    config: {
      roles: MANAGEMENT_ROLES,
    },
  },
];

const adminRouteConfig = {
  auth: { scope: [] },
  policies: adminPolicy,
};

export default factories.createCoreRouter("api::local-user.local-user", {
  config: {
    find: adminRouteConfig,
    findOne: adminRouteConfig,
    create: adminRouteConfig,
    update: adminRouteConfig,
    delete: adminRouteConfig,
  },
});
