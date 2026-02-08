export type TrafficDashboardParams = {
  startDate?: string;
  endDate?: string;
};

export type TrafficRealtime = {
  activeVisitorsLast5Min: number;
  activeVisitorsLast30Min: number;
  topPagesNow: Array<{ url: string; visits: number }>;
  updatedAt: string;
};

export type TrafficDashboard = {
  range: {
    startDate: string;
    endDate: string;
  };
  summary: {
    visits: number;
    visitors: number;
    pageviews: number;
    bounceRate: number;
    avgActionsPerVisit: number;
    avgVisitDuration: number;
  };
  realtime: {
    activeVisitorsLast5Min: number;
    activeVisitorsLast30Min: number;
    topPagesNow: Array<{ url: string; visits: number }>;
  };
  series: Array<{
    date: string;
    visits: number;
    visitors: number;
    pageviews: number;
  }>;
  acquisition: {
    sources: Array<{ source: string; visits: number; visitors: number }>;
    campaigns: Array<{ campaign: string; visits: number; visitors: number }>;
  };
  pages: {
    top: Array<{ url: string; pageviews: number; uniquePageviews: number }>;
    landing: Array<{ url: string; entries: number; bounceRate: number }>;
    exit: Array<{ url: string; exits: number; exitRate: number }>;
  };
  funnel: Array<{
    step: "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
    count: number;
    conversionFromPrevious: number | null;
  }>;
  deviceBreakdown: Array<{ device: string; visits: number }>;
  geoBreakdown: Array<{ country: string; visits: number }>;
  ecommerce: {
    orders: number;
    totalOrders: number;
    revenue: number;
    conversionRate: number;
  };
  updatedAt: string;
};
