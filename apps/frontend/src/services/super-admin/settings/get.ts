import { apiClient } from "@/services";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import { defaultSettings, normalizeSuperAdminSettings } from "@/types/super-admin/settings";

export async function getSuperAdminSettings(): Promise<SuperAdminSettings> {
  try {
    const res = await apiClient.get("/settings?populate=*");
    const raw = (res as {
      data?: {
        id?: number;
        attributes?: Record<string, unknown>;
        createdAt?: string;
        updatedAt?: string;
      };
    })?.data;
    if (!raw) return defaultSettings();

    const data = {
      ...(raw.attributes ?? {}),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    return normalizeSuperAdminSettings(data, raw.id ?? 1);
  } catch (error: unknown) {
    const status =
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
        ? (error.response as { status: number }).status
        : error && typeof error === "object" && "status" in error
          ? (error as { status: number }).status
          : undefined;
    if (status === 404) return defaultSettings();
    throw error;
  }
}
