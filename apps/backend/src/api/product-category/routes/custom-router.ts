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
      path: "/product-categories/:id/delete-with-reassign",
      handler: "product-category.deleteWithReassign",
      config: {
        auth: { scope: [] },
        middlewares: ["global::authentication"],
        policies: superadminOnlyPolicy,
      },
    },
  ],
};
