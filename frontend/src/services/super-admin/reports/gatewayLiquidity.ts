import { apiClient } from "@/services";
import { formatQueryParams } from "@/utils/api";

export async function getGatewayLiquidity(params: {
  start?: string;
  end?: string;
}) {
  const query = formatQueryParams(params as any);
  const res = await apiClient.get(`/reports/gateway-liquidity${query}`);
  return (res as any).data as Array<{
    gatewayId: number | null;
    gatewayTitle: string;
    total: number;
  }>;
}
