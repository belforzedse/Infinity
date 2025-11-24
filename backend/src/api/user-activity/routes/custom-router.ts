/**
 * Custom router for user-activity APIs
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/user-activities/me",
      handler: "user-activity.findUserActivities",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "POST",
      path: "/user-activities/mark-read",
      handler: "user-activity.markRead",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "POST",
      path: "/user-activities/mark-all-read",
      handler: "user-activity.markAllRead",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/user-activities/unread-count",
      handler: "user-activity.unreadCount",
      config: {
        auth: { scope: [] },
      },
    },
    {
      method: "GET",
      path: "/user-activities/user/:userId",
      handler: "user-activity.findUserActivitiesByUserId",
      config: {
        auth: { scope: [] },
      },
    },
  ],
};
