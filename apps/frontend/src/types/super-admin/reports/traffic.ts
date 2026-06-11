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

/** Period-over-period comparison. `changePct` is null when the baseline is 0. */
export type MetricDelta = {
  current: number;
  previous: number;
  change: number;
  changePct: number | null;
};

export type LabeledVisits = { label: string; visits: number; visitors: number };

export type TrafficDashboard = {
  range: {
    startDate: string;
    endDate: string;
  };
  comparisonRange: {
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
  comparison: {
    visits: MetricDelta;
    visitors: MetricDelta;
    pageviews: MetricDelta;
    bounceRate: MetricDelta;
    avgVisitDuration: MetricDelta;
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
    channelTypes: LabeledVisits[];
    sources: Array<{ source: string; visits: number; visitors: number }>;
    searchEngines: LabeledVisits[];
    socials: LabeledVisits[];
    campaigns: Array<{ campaign: string; visits: number; visitors: number }>;
  };
  pages: {
    top: Array<{ url: string; pageviews: number; uniquePageviews: number }>;
    landing: Array<{ url: string; entries: number; bounceRate: number }>;
    exit: Array<{ url: string; exits: number; exitRate: number }>;
  };
  siteSearch: {
    keywords: Array<{ keyword: string; searches: number; resultsPageviews: number }>;
    noResults: Array<{ keyword: string; searches: number }>;
  };
  audience: {
    devices: Array<{ device: string; visits: number }>;
    browsers: LabeledVisits[];
    operatingSystems: LabeledVisits[];
    languages: LabeledVisits[];
    countries: Array<{ country: string; visits: number }>;
    newVsReturning: { newVisits: number; returningVisits: number };
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
  tracking: {
    configured: boolean;
    version: string | null;
    partial: boolean;
    sectionErrors: Record<string, string>;
    capabilities: {
      siteSearch: boolean;
      events: boolean;
      visitFrequency: boolean;
    };
  };
  updatedAt: string;
};
