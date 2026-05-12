import type { ApiError } from "@repo/api/types";
import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/lib/api-endpoints";
import { handleAuthErrors } from "@/utils/auth";

const COMMENT_TIMEOUT_MS = 15000;

function authHeaders(): Record<string, string> | undefined {
  const accessToken =
    typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function createPostComment(input: {
  postId: string | number;
  content: string;
  parentCommentId?: string | number;
}): Promise<void> {
  try {
    await apiClient.post(
      ENDPOINTS.POST_COMMENTS.CREATE,
      {
        data: {
          Content: input.content,
          post: input.postId,
          ...(input.parentCommentId ? { parent_comment: input.parentCommentId } : {}),
        },
      },
      {
        headers: authHeaders(),
        cache: "no-store",
        timeout: COMMENT_TIMEOUT_MS,
        retries: 0,
      },
    );
  } catch (error: unknown) {
    handleAuthErrors(error as ApiError);
    throw error;
  }
}
