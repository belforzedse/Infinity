/**
 * blog-author router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::blog-author.blog-author", {
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
      auth: false,
      middlewares: ["global::authentication"],
    },
    update: {
      auth: false,
      middlewares: ["global::authentication"],
    },
    delete: {
      auth: false,
      middlewares: ["global::authentication"],
    },
  },
});
