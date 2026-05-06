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
      path: "/sp/local-users",
      handler: "local-user.createUser",
      config: {
        auth: { scope: [] },
        policies: adminPolicy,
      },
    },
    {
      method: "PUT",
      path: "/sp/local-users/:id",
      handler: "local-user.updateUser",
      config: {
        auth: { scope: [] },
        policies: adminPolicy,
      },
    },
  ],
};
