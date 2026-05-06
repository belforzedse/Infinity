/**
 * Migration: Remove unique constraints from product-variation-color table
 *
 * Allows duplicate color names and hex codes in the product_variation_colors table.
 * This enables multiple colors with the same name (e.g., multiple "سفید" entries)
 * and the same hex code.
 */

module.exports = {
  async up(knex) {
    const tableExists = async (tableName) => {
      try {
        return await knex.schema.hasTable(tableName);
      } catch (error) {
        console.warn(`Failed to check if table ${tableName} exists:`, error.message);
        return false;
      }
    };

    const constraintExists = async (tableName, constraintName) => {
      try {
        const result = await knex.raw(
          `SELECT 1 FROM pg_constraint WHERE conrelid = $1::regclass AND conname = $2 LIMIT 1`,
          [tableName, constraintName],
        );
        return result.rows.length > 0;
      } catch (error) {
        return false;
      }
    };

    const indexExists = async (indexName, tableName) => {
      try {
        const result = await knex.raw(
          `SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND tablename = $1 AND indexname = $2 LIMIT 1`,
          [tableName, indexName],
        );
        return result.rows.length > 0;
      } catch (error) {
        return false;
      }
    };

    if (await tableExists("product_variation_colors")) {
      // Drop unique constraint on Title column
      // Strapi typically creates unique constraints as indexes with pattern: table_column_unique
      const titleIndexName = "product_variation_colors_title_unique";
      const titleConstraintName = "product_variation_colors_title_unique";

      if (await indexExists(titleIndexName, "product_variation_colors")) {
        try {
          await knex.raw(`DROP INDEX IF EXISTS "${titleIndexName}"`);
          console.log(`✓ Dropped unique index on product_variation_colors.Title`);
        } catch (error) {
          console.log(`Error dropping Title unique index: ${error.message}`);
        }
      }

      // Also try dropping as constraint if it exists
      if (await constraintExists("product_variation_colors", titleConstraintName)) {
        try {
          await knex.raw(
            `ALTER TABLE product_variation_colors DROP CONSTRAINT IF EXISTS "${titleConstraintName}"`,
          );
          console.log(`✓ Dropped unique constraint on product_variation_colors.Title`);
        } catch (error) {
          console.log(`Error dropping Title unique constraint: ${error.message}`);
        }
      }

      // Drop unique constraint on ColorCode column
      const colorCodeIndexName = "product_variation_colors_color_code_unique";
      const colorCodeConstraintName = "product_variation_colors_color_code_unique";

      if (await indexExists(colorCodeIndexName, "product_variation_colors")) {
        try {
          await knex.raw(`DROP INDEX IF EXISTS "${colorCodeIndexName}"`);
          console.log(`✓ Dropped unique index on product_variation_colors.ColorCode`);
        } catch (error) {
          console.log(`Error dropping ColorCode unique index: ${error.message}`);
        }
      }

      // Also try dropping as constraint if it exists
      if (await constraintExists("product_variation_colors", colorCodeConstraintName)) {
        try {
          await knex.raw(
            `ALTER TABLE product_variation_colors DROP CONSTRAINT IF EXISTS "${colorCodeConstraintName}"`,
          );
          console.log(`✓ Dropped unique constraint on product_variation_colors.ColorCode`);
        } catch (error) {
          console.log(`Error dropping ColorCode unique constraint: ${error.message}`);
        }
      }

      // Try alternative naming patterns that Strapi might use
      const alternativePatterns = [
        "product_variation_colors_title_unique",
        "product_variation_colors_colorcode_unique",
        "product_variation_colors_color_code_unique",
      ];

      for (const pattern of alternativePatterns) {
        if (await indexExists(pattern, "product_variation_colors")) {
          try {
            await knex.raw(`DROP INDEX IF EXISTS "${pattern}"`);
            console.log(`✓ Dropped alternative unique index: ${pattern}`);
          } catch (error) {
            // Ignore errors for alternative patterns
          }
        }
      }

      console.log("✅ Color unique constraints removal completed successfully!");
    } else {
      console.warn("product_variation_colors table does not exist, skipping migration");
    }
  },

  async down(knex) {
    // Rollback: Re-add unique constraints
    const tableExists = async (tableName) => {
      return await knex.schema.hasTable(tableName);
    };

    if (await tableExists("product_variation_colors")) {
      try {
        // Re-add unique constraint on Title (column name is 'title' in database)
        await knex.raw(
          `CREATE UNIQUE INDEX IF NOT EXISTS product_variation_colors_title_unique ON product_variation_colors (title)`,
        );
        console.log("✓ Re-added unique constraint on product_variation_colors.title");
      } catch (error) {
        console.log("Error re-adding title unique constraint:", error.message);
      }

      try {
        // Re-add unique constraint on ColorCode (column name is 'color_code' in database)
        await knex.raw(
          `CREATE UNIQUE INDEX IF NOT EXISTS product_variation_colors_color_code_unique ON product_variation_colors (color_code)`,
        );
        console.log("✓ Re-added unique constraint on product_variation_colors.color_code");
      } catch (error) {
        console.log("Error re-adding color_code unique constraint:", error.message);
      }

      console.log("✅ Color unique constraints rollback completed");
    }
  },
};
