import { AsyncLocalStorage } from "async_hooks";

export interface AuditContext {
  userId: number | null;
  userLabel: string | null;
  username: string | null;
  email: string | null;
  isAdmin: boolean;
  ip: string | null;
  userAgent: string | null;
}

// Global storage for audit context
const auditContextStorage = new AsyncLocalStorage<AuditContext>();

export const getAuditContext = (): AuditContext | undefined => {
  return auditContextStorage.getStore();
};

export const runWithAuditContext = async <T>(
  context: AuditContext,
  callback: () => Promise<T>
): Promise<T> => {
  return auditContextStorage.run(context, callback);
};

export const setAuditContext = (context: AuditContext): AuditContext => {
  // For synchronous context setting (used in middleware)
  return context;
};

export const createAuditContext = (user: any, isAdmin = false): AuditContext => {
  const userId = normalizeUserId(user?.id ?? user);
  const userLabel =
    user?.username ||
    user?.email ||
    user?.Phone ||
    user?.fullName ||
    (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : null) ||
    null;

  return {
    userId,
    userLabel,
    username: user?.username || null,
    email: user?.email || null,
    isAdmin,
    ip: null,
    userAgent: null,
  };
};

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
