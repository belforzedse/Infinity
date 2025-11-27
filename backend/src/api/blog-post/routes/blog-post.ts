/**
 * blog-post router
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::blog-post.blog-post", {
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
    },
    update: {
      auth: { scope: [] },
    },
    delete: {
      auth: { scope: [] },
    },
  },
  only: ["find", "findOne", "create", "update", "delete"],
});
