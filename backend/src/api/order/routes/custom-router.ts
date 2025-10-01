/**
 * Custom router for order APIs
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/orders/payment-callback",
      handler: "order.verifyPayment",
      config: {
        auth: false,
        // No authentication middleware for the callback from payment gateway
      },
    },
    {
      method: "GET",
      path: "/orders/:id/payment-status",
      handler: "order.checkPaymentStatus",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "GET",
      path: "/orders/my-orders",
      handler: "order.getMyOrders",
      config: {
        auth: false,
        middlewares: ["global::authentication"],
      },
    },
    {
      method: "POST",
      path: "/orders/:id/anipo-barcode",
      handler: "order.generateAnipoBarcode",
      config: {
        auth: false,
      },
    },
  ],
};
