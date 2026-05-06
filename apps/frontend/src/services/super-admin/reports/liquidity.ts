import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export type LiquidityInterval = "day" | "week" | "month";

export async function getLiquidity(params: {
  start?: string;
  end?: string;
  interval?: LiquidityInterval;
}) {
  const query = formatQueryParams(params as any);
  const res = await apiClient.get(`/reports/liquidity${query}`);
  return (res as any).data;
}
