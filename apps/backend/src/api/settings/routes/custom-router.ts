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
      method: "GET",
      path: "/site-settings",
      handler: "settings.find",
      config: {
        auth: false,
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "PUT",
      path: "/site-settings",
      handler: "settings.update",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/settings/hero-slider",
      handler: "settings.getHeroSlider",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: superadminOnlyPolicy,
      },
    },
    {
      method: "PUT",
      path: "/settings/hero-slider/draft",
      handler: "settings.updateHeroSliderDraft",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: superadminOnlyPolicy,
      },
    },
    {
      method: "POST",
      path: "/settings/hero-slider/publish",
      handler: "settings.publishHeroSliderDraft",
      config: {
        auth: { scope: [] },
        middlewares: [],
        policies: superadminOnlyPolicy,
      },
    },
  ],
};
