export default {
  routes: [
    {
      method: "POST",
      path: "/auth/otp",
      handler: "auth.otp",
      config: {
        auth: false,
        policies: [],
        middlewares: ["api::auth.throttle"],
      },
    },
    {
      method: "POST",
      path: "/auth/login",
      handler: "auth.login",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "GET",
      path: "/auth/self",
      handler: "auth.self",
      config: {
        auth: false,
      },
    },
    {
      method: "PUT",
      path: "/auth/self",
      handler: "auth.updateSelf",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/welcome",
      handler: "auth.welcome",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/auth/register-info",
      handler: "auth.registerInfo",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/auth/login-with-password",
      handler: "auth.loginWithPassword",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/auth/reset-password",
      handler: "auth.resetPassword",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
