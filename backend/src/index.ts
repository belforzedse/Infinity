import { createClient } from "redis";
import override from "./api/auth/documentation/1.0.0/overrides/auth.json";
import localUserOverride from "./api/local-user/documentation/1.0.0/overrides/local-user.json";

import productLifeCycles from "./api/product/lifecycles";
import productVariationLifeCycles from "./api/product-variation/lifecycles";

export const RedisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect()
  .then((client) => {
    console.log("Redis connected");
    return client;
  });

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    if (strapi.plugin("documentation")) {
      strapi
        .plugin("documentation")
        .service("override")
        .registerOverride(override, {});

      strapi
        .plugin("documentation")
        .service("override")
        .registerOverride(localUserOverride, {});
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    strapi.db.lifecycles.subscribe(productLifeCycles);
    strapi.db.lifecycles.subscribe(productVariationLifeCycles);
  },
};
