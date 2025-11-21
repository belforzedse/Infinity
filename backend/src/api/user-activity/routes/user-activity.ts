export default {
  routes: [
    {
      method: "GET",
      path: "/user-activities",
      handler: "user-activity.find",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/user-activities/:id",
      handler: "user-activity.findOne",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/user-activities",
      handler: "user-activity.create",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "PUT",
      path: "/user-activities/:id",
      handler: "user-activity.update",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "DELETE",
      path: "/user-activities/:id",
      handler: "user-activity.delete",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};



