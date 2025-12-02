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
  amountIrr: number,
): Promise<{
  success: boolean;
  redirectUrl?: string;
  refId?: string;
  saleOrderId?: string;
}> => {
  const res = await apiClient.post<ChargeIntentResponse>("/wallet/charge-intent", {
    amount: amountIrr,
  });
  return {
    success: !!res?.data?.success,
    redirectUrl: res?.data?.redirectUrl,
    refId: res?.data?.refId,
    saleOrderId: res?.data?.saleOrderId,
  } as any;
};

export interface WalletTransaction {
  id: number;
  Amount: number;
  Type: "Add" | "Minus";
  Date: string;
  Cause?: string;
  ReferenceId?: string;
  Note?: string;
  Description?: string;
}

export interface WalletTransactionsResponse {
  data: WalletTransaction[];
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export const getWalletTransactions = async (walletId: number): Promise<WalletTransactionsResponse> => {
  const res = await apiClient.get<WalletTransactionsResponse>(
    `/local-user-wallet-transactions?filters[user_wallet][id][$eq]=${walletId}&sort[0]=Date:desc&pagination[pageSize]=100`
  );
  return res as any;
};

const WalletService = { getMyWallet, startTopup, getWalletTransactions };
export default WalletService;
