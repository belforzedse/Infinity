import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export type LiquidityInterval = "day" | "week" | "month";

export interface LiquiditySeriesPoint {
  bucket: string;
  total: number;
}

export interface LiquiditySummary {
  previousTotal: number;
  deltaAbs: number;
  deltaPct: number | null;
  bucketCount: number;
  averagePerBucket: number;
  peakBucket: string | null;
  peakValue: number;
}

export interface LiquidityPayload {
  interval: LiquidityInterval;
  start: string | Date;
  end: string | Date;
  total: number;
  series: LiquiditySeriesPoint[];
  summary?: LiquiditySummary;
}

export interface LiquidityResponse {
  data: LiquidityPayload;
}

export async function getLiquidity(params: {
  start?: string;
  end?: string;
  interval?: LiquidityInterval;
}): Promise<LiquidityResponse> {
  const query = formatQueryParams(params as any);
  const res = await apiClient.get<LiquidityResponse>(`/reports/liquidity${query}`);
  return res as LiquidityResponse;
}
