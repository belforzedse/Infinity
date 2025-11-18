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
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/orders/my-orders",
      handler: "order.getMyOrders",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/orders/my-orders/:id",
      handler: "order.getMyOrderDetail",
      config: {
        auth: { scope: [] },
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
    {
      method: "POST",
      path: "/orders/:id/admin/adjust-items",
      handler: "order.adminAdjustItems",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "POST",
      path: "/orders/:id/admin/cancel",
      handler: "order.adminCancel",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "POST",
      path: "/orders/:id/admin/void-barcode",
      handler: "order.adminVoidBarcode",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
