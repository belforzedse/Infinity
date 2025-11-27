/**
 * blog-category router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::blog-category.blog-category", {
  config: {
    find: {
      auth: false,
      middlewares: [],
    },
    findOne: {
      auth: false,
      middlewares: [],
    },
    create: {
      auth: { scope: [] },
      middlewares: [],
    },
    update: {
      auth: { scope: [] },
      middlewares: [],
    },
    delete: {
      auth: { scope: [] },
      middlewares: [],
    },
  },
});
