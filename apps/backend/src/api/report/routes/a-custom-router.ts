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
      path: "/reports/products/overview",
      handler: "report.productOverview",
      config: { auth: { scope: [] } },
    },
    {
      method: "GET",
      path: "/reports/products/trends",
      handler: "report.productTrends",
      config: { auth: { scope: [] } },
    },
    {
      method: "GET",
      path: "/reports/products/performance",
      handler: "report.productPerformance",
      config: { auth: { scope: [] } },
    },
    {
      method: "GET",
      path: "/reports/products/export",
      handler: "report.productExport",
      config: { auth: { scope: [] } },
    },
    {
      method: "GET",
      path: "/reports/products/detail",
      handler: "report.productDetail",
      config: { auth: { scope: [] } },
    },
    {
      method: "GET",
      path: "/reports/products/inventory",
      handler: "report.productInventory",
      config: { auth: { scope: [] } },
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
    {
      method: "GET",
      path: "/reports/admin-activity/:id",
      handler: "report.adminActivityById",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/reports/traffic/dashboard",
      handler: "report.trafficDashboard",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/reports/traffic/realtime",
      handler: "report.trafficRealtime",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
