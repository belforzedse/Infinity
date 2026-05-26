import { apiClient } from "@/services";

export const COMMERCE_PURGE_CONFIRMATION = "DELETE_COMMERCE_DATA";

export type CommercePurgeSummary = {
  dryRun: boolean;
  confirmationRequired: string;
  summary: Record<string, number>;
  labels?: Record<string, string>;
  mediaRelations: {
    relationRowsDeleted: number;
    physicalFilesDeleted: number;
  };
  kept: readonly string[];
  needsConfirmation: readonly string[];
};

type CommercePurgeResponse = {
  data: CommercePurgeSummary;
};

export async function dryRunCommercePurge(): Promise<CommercePurgeSummary> {
  const response = await apiClient.post<CommercePurgeResponse>(
    "/admin/commerce-data/purge",
    { dryRun: true },
  );
  return (response as any).data;
}

export async function executeCommercePurge(
  confirmation: string,
): Promise<CommercePurgeSummary> {
  const response = await apiClient.post<CommercePurgeResponse>(
    "/admin/commerce-data/purge",
    {
      dryRun: false,
      confirmation,
    },
  );
  return (response as any).data;
}
