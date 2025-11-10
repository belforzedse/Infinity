/**
 * Custom router for report APIs
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/reports/liquidity",
      handler: "report.liquidity",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/reports/product-sales",
      handler: "report.productSales",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/reports/gateway-liquidity",
      handler: "report.gatewayLiquidity",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/reports/admin-activity",
      handler: "report.adminActivity",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
