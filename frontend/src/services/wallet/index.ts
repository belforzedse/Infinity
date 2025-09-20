import { apiClient } from "../index";

export interface ChargeIntentResponse {
  success: boolean;
  redirectUrl?: string;
  refId?: string;
  saleOrderId?: string;
}

export interface WalletMeResponse {
  success: boolean;
  data?: {
    id: number;
    balance: number; // IRR
    lastTransactionDate?: string;
    description?: string;
  };
}

export const getMyWallet = async (): Promise<WalletMeResponse> => {
  const res = await apiClient.get<WalletMeResponse>("/local-user-wallet/me");
  return res as any;
};

export const startTopup = async (
  amountIrr: number
): Promise<{
  success: boolean;
  redirectUrl?: string;
  refId?: string;
  saleOrderId?: string;
}> => {
  const res = await apiClient.post<ChargeIntentResponse>(
    "/wallet/charge-intent",
    { amount: amountIrr }
  );
  return {
    success: !!res?.data?.success,
    redirectUrl: res?.data?.redirectUrl,
    refId: res?.data?.refId,
    saleOrderId: res?.data?.saleOrderId,
  } as any;
};

const WalletService = { getMyWallet, startTopup };
export default WalletService;
