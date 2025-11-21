"use strict";

/**
 * Migration to enhance admin-activity schema with Title, Message, MessageEn, Severity, and Changes fields
 */
module.exports = {
  async up(knex) {
    // Add new columns
    await knex.schema.alterTable("admin_activities", (table) => {
      table.string("title").nullable();
      table.text("message").nullable();
      table.string("message_en").nullable();
      table.enum("severity", ["info", "success", "warning", "error"]).defaultTo("info");
      table.json("changes").nullable();
    });

    // Backfill existing records with basic titles/messages based on existing data
    const activities = await knex("admin_activities").select("*");
    for (const activity of activities) {
      let title = "";
      let message = "";
      let messageEn = "";
      let severity = "info";

      // Generate title and message from existing Description and Action
      const action = activity.action || "";
      const resourceType = activity.resource_type || "";
      const resourceId = activity.resource_id || "";

      switch (action) {
        case "Create":
          title = `${resourceType} ایجاد شد`;
          message = `${resourceType} ${resourceId ? `#${resourceId}` : ""} ایجاد شد`;
          messageEn = `${resourceType} ${resourceId ? `#${resourceId}` : ""} was created`;
          severity = "success";
          break;
        case "Update":
          title = `${resourceType} ویرایش شد`;
          message = `${resourceType} ${resourceId ? `#${resourceId}` : ""} ویرایش شد`;
          messageEn = `${resourceType} ${resourceId ? `#${resourceId}` : ""} was updated`;
          severity = "info";
          break;
        case "Delete":
          title = `${resourceType} حذف شد`;
          message = `${resourceType} ${resourceId ? `#${resourceId}` : ""} حذف شد`;
          messageEn = `${resourceType} ${resourceId ? `#${resourceId}` : ""} was deleted`;
          severity = "warning";
          break;
        case "Adjust":
          title = `${resourceType} تنظیم شد`;
          message = `${resourceType} ${resourceId ? `#${resourceId}` : ""} تنظیم شد`;
          messageEn = `${resourceType} ${resourceId ? `#${resourceId}` : ""} was adjusted`;
          severity = "info";
          break;
        default:
          title = activity.description || "فعالیت ادمین";
          message = activity.description || "فعالیت ادمین";
          messageEn = activity.description || "Admin activity";
          severity = "info";
      }

      await knex("admin_activities").where({ id: activity.id }).update({
        title,
        message,
        message_en: messageEn,
        severity,
      });
    }

    // Add indexes for better query performance
    await knex.schema.alterTable("admin_activities", (table) => {
      table.index(["resource_type", "resource_id"], "admin_activities_resource_idx");
      table.index(["performed_by"], "admin_activities_performed_by_idx");
      table.index(["created_at"], "admin_activities_created_at_idx");
    });
  },

  async down(knex) {
    // Remove indexes
    await knex.schema.alterTable("admin_activities", (table) => {
      table.dropIndex([], "admin_activities_resource_idx");
      table.dropIndex([], "admin_activities_performed_by_idx");
      table.dropIndex([], "admin_activities_created_at_idx");
    });

    // Remove new columns
    await knex.schema.alterTable("admin_activities", (table) => {
      table.dropColumn("title");
      table.dropColumn("message");
      table.dropColumn("message_en");
      table.dropColumn("severity");
      table.dropColumn("changes");
    });
  },
};

