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
} as const;
