/**
 * Custom router for cart APIs
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/carts/me",
      handler: "cart.getMyCart",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "POST",
      path: "/carts/add-item",
      handler: "cart.addItem",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "PUT",
      path: "/carts/update-item",
      handler: "cart.updateItem",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "DELETE",
      path: "/carts/remove-item/:id",
      handler: "cart.removeItem",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "GET",
      path: "/carts/check-stock",
      handler: "cart.checkStock",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "POST",
      path: "/carts/apply-discount",
      handler: "cart.applyDiscount",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "POST",
      path: "/carts/finalize",
      handler: "cart.finalizeToOrder",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "POST",
      path: "/carts/shipping-preview",
      handler: "cart.shippingPreview",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
  ],
};
