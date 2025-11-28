"use strict";

/**
 * Migration to enhance admin-activity schema with Title, Message, MessageEn, Severity, and Changes fields
 */
module.exports = {
  async up(knex) {
    // Check if table exists
    const hasTable = await knex.schema.hasTable("admin_activities");
    if (!hasTable) {
      console.log("[Migration] admin_activities table does not exist yet. Skipping migration - Strapi will create it with the correct schema.");
      return;
    }

    // Check which columns already exist
    const columns = await knex("admin_activities").columnInfo();
    const hasTitle = "title" in columns;
    const hasMessage = "message" in columns;
    const hasMessageEn = "message_en" in columns;
    const hasSeverity = "severity" in columns;
    const hasChanges = "changes" in columns;

    // Add new columns only if they don't exist (using separate alterTable calls)
    if (!hasTitle) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.string("title").nullable();
      });
    }
    if (!hasMessage) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.text("message").nullable();
      });
    }
    if (!hasMessageEn) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.string("message_en").nullable();
      });
    }
    if (!hasSeverity) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.enum("severity", ["info", "success", "warning", "error"]).defaultTo("info");
      });
    }
    if (!hasChanges) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.json("changes").nullable();
      });
    }

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
  },

  async down(knex) {
    // Check if table exists
    const hasTable = await knex.schema.hasTable("admin_activities");
    if (!hasTable) {
      console.log("[Migration] admin_activities table does not exist. Nothing to rollback.");
      return;
    }

    // Check which columns exist before trying to drop them
    const columns = await knex("admin_activities").columnInfo();
    const hasTitle = "title" in columns;
    const hasMessage = "message" in columns;
    const hasMessageEn = "message_en" in columns;
    const hasSeverity = "severity" in columns;
    const hasChanges = "changes" in columns;

    // Remove new columns only if they exist (using separate alterTable calls)
    if (hasTitle) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.dropColumn("title");
      });
    }
    if (hasMessage) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.dropColumn("message");
      });
    }
    if (hasMessageEn) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.dropColumn("message_en");
      });
    }
    if (hasSeverity) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.dropColumn("severity");
      });
    }
    if (hasChanges) {
      await knex.schema.alterTable("admin_activities", (table) => {
        table.dropColumn("changes");
      });
    }
  },
};

