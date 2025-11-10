import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";
import type { PluginUserDetails } from "./getDetails";
import { normalizePluginUser } from "./getDetails";

export const getAll = async (): Promise<PluginUserDetails[]> => {
  const endpoint = `${ENDPOINTS.USER.GET_ALL}`;

  const response = await apiClient.get<PluginUserDetails[]>(endpoint);
  const payload = (response as any)?.data ?? response;

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((item) => normalizePluginUser(item));
};
