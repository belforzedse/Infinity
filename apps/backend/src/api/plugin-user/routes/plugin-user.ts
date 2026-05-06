import { MANAGEMENT_ROLES } from "../../../utils/roles";

const adminPolicy = [
  {
    name: "global::role-based",
    config: {
      roles: MANAGEMENT_ROLES,
    },
  },
];

export default {
  routes: [
    {
      method: "POST",
      path: "/sp/plugin-users",
      handler: "plugin-user.createPluginUser",
      config: {
        auth: { scope: [] },
        policies: adminPolicy,
      },
    },
  ],
};

