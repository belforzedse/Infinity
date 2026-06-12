export const DASHBOARD_USER_ACTION_HREF = "/super-admin/users";

export const DASHBOARD_QUICK_ACTIONS = [
  { href: "/super-admin/orders", label: "پیگیری سفارش‌ها" },
  { href: "/super-admin/products", label: "مدیریت محصولات" },
  { href: DASHBOARD_USER_ACTION_HREF, label: "مشتریان" },
];

const normalizeRole = (roleName?: string | null) =>
  (roleName ?? "").toString().trim().toLowerCase();

export const canSeeDashboardUserMetric = (roleName?: string | null): boolean => {
  const normalizedRole = normalizeRole(roleName);
  return normalizedRole !== "store manager" && normalizedRole !== "founder";
};

export const getDashboardQuickActionsForRole = (roleName?: string | null) => {
  if (canSeeDashboardUserMetric(roleName)) {
    return DASHBOARD_QUICK_ACTIONS;
  }

  return DASHBOARD_QUICK_ACTIONS.filter((action) => action.href !== DASHBOARD_USER_ACTION_HREF);
};
