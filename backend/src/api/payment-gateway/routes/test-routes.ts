/**
 * Test routes for SnappPay operations
 * Only enable in development/staging environments
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/snappay/test-cancel",
      handler: "payment-gateway.testSnappayCancel",
      config: {
        auth: false,
        // In production, add authentication middleware
      },
    },
    {
      method: "POST",
      path: "/snappay/test-revert",
      handler: "payment-gateway.testSnappayRevert",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/snappay/test-status",
      handler: "payment-gateway.testSnappayStatus",
      config: {
        auth: false,
      },
    },
  ],
};
