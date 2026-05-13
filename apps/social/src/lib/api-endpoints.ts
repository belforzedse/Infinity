/**
 * API paths for the social app (auth + user + stories subset of storefront `ENDPOINTS`).
 */

export const ENDPOINTS = {
  AUTH: {
    EXISTS: "/auth/welcome",
    SEND_OTP: "/auth/otp",
    VERIFY_OTP: "/auth/login",
    LOGIN_OTP: "/auth/login-otp",
    RESET_PASSWORD: "/auth/reset-password",
    REGISTER: "/auth/register-info",
    LOGIN_PASSWORD: "/auth/login-with-password",
  },
  USER: {
    ME: "/auth/self",
  },
  STORIES: {
    ACTIVE: "/stories/active",
    SEEN_MARK: "/story-seens/mark",
    SEEN_MINE: "/story-seens/mine",
  },
  FILE: {
    UPLOAD: "/upload",
    DOWNLOAD: "/upload/files",
  },
  POSTS: {
    LIST: "/posts",
    CREATE: "/posts",
    DETAIL: (id: number | string) => `/posts/${id}`,
  },
  POST_COMMENTS: {
    LIST_FOR_POST: (postId: number | string) => `/post-comments/post/${postId}`,
    CREATE: "/post-comments",
    LIST: "/post-comments",
    APPROVE: (id: number | string) => `/post-comments/${id}/approve`,
    REJECT: (id: number | string) => `/post-comments/${id}/reject`,
  },
  POST_LIKES: {
    TOGGLE: "/post-likes/toggle",
    USER_LIKES: "/post-likes/user/me",
  },
  POST_COMMENT_LIKES: {
    TOGGLE: "/post-comment-likes/toggle",
    USER_LIKES: "/post-comment-likes/user/me",
  },
  POST_BOOKMARKS: {
    TOGGLE: "/post-bookmarks/toggle",
    USER_BOOKMARKS: "/post-bookmarks/user/me",
  },
} as const;
