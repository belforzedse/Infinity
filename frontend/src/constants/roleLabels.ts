export const PLUGIN_ROLE_LABELS: Record<string, string> = {
  Superadmin: "سوپر ادمین",
  "Store manager": "مدیر فروشگاه",
  Customer: "مشتری",
};

export const translatePluginRoleLabel = (roleName?: string | null) => {
  if (!roleName) return "";
  return PLUGIN_ROLE_LABELS[roleName] ?? roleName;
};
