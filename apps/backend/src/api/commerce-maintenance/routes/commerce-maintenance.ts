import { ROLE_NAMES } from "../../../utils/roles";

const superadminOnlyPolicy = [
  {
    name: "global::role-based",
    config: {
      roles: [ROLE_NAMES.SUPERADMIN],
    },
  },
];

export default {
  routes: [
    {
      method: "POST",
      path: "/admin/commerce-data/purge",
      handler: "commerce-maintenance.purge",
      config: {
        auth: { scope: [] },
        middlewares: ["global::authentication"],
        policies: superadminOnlyPolicy,
      },
    },
  ],
};
