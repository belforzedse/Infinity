type EventContext = {
  state?: { user?: any };
};

type LifecycleEvent = {
  state?: { user?: any };
  params?: Record<string, unknown>;
};

export interface AuditActorInfo {
  userId: number | null;
  label: string | null;
  ip: string | null;
  userAgent: string | null;
}

const normalizeUserId = (value: unknown): number | null => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const extractLabel = (user: any): string | null => {
  if (!user) return null;
  return (
    user.username ||
    user.email ||
    user.Phone ||
    user.fullName ||
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
    null
  );
};

export const resolveAuditActor = (event?: LifecycleEvent): AuditActorInfo => {
  const requestCtx = (global as any)?.strapi?.requestContext?.get?.() as
    | (EventContext & { request?: any })
    | undefined;

  const user =
    requestCtx?.state?.user ||
    (event as any)?.state?.user ||
    (event as any)?.params?.data?.performed_by ||
    null;

  const userId = normalizeUserId(user?.id ?? user);
  const label = extractLabel(user) || (userId ? `User ${userId}` : null);
  const rawIp =
    requestCtx?.request?.ip ||
    requestCtx?.request?.header?.["x-forwarded-for"] ||
    requestCtx?.request?.headers?.["x-forwarded-for"] ||
    null;
  const ip = typeof rawIp === "string" ? rawIp.split(",")[0].trim() : null;
  const userAgent =
    requestCtx?.request?.header?.["user-agent"] ||
    requestCtx?.request?.headers?.["user-agent"] ||
    null;

  return {
    userId,
    label,
    ip,
    userAgent: userAgent ? String(userAgent) : null,
  };
};
