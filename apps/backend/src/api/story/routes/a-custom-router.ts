/**
 * Custom router for story APIs
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/stories/active",
      handler: "story.getActive",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
