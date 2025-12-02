import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import type { UploadedImage } from "./upload";
import { toast } from "react-hot-toast";

interface ListFilesOptions {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
}

/**
 * Fetch media files from Strapi upload library
 * Defaults to latest 30 items to keep payload small
 */
export const listFiles = async ({
  page = 1,
  pageSize = 30,
  searchQuery,
}: ListFilesOptions = {}): Promise<UploadedImage[]> => {
  try {
    const response = await apiClient.get<UploadedImage[] | UploadedImage>(ENDPOINTS.FILE.DOWNLOAD, {
      params: {
        sort: "createdAt:desc",
        "pagination[page]": page,
        "pagination[pageSize]": pageSize,
        ...(searchQuery
          ? {
              "filters[$or][0][name][$containsi]": searchQuery,
              "filters[$or][1][alternativeText][$containsi]": searchQuery,
            }
          : {}),
      },
      cache: "no-store",
    });

    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }

    // Some Strapi setups wrap the payload or return single object; normalize to array
    return data ? [data] : [];
  } catch (error) {
    console.error("Failed to load media library", error);
    toast.error("خطا در دریافت کتابخانه رسانه");
    throw error;
  }
};
