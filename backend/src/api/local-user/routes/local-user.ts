/**
 * local-user router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::local-user.local-user", {
  config: {
    find: {
      middlewares: ["global::authentication", "global::require-admin"],
    },
    findOne: {
      middlewares: ["global::authentication", "global::require-admin"],
    },
    create: {
      middlewares: ["global::authentication", "global::require-admin"],
    },
    update: {
      middlewares: ["global::authentication", "global::require-admin"],
    },
    delete: {
      middlewares: ["global::authentication", "global::require-admin"],
    },
  },
});
