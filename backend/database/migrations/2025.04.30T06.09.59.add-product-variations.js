/**
 * Migration `add-product-variations`
 */

module.exports = {
  async up(knex) {
    try {
      // Colors in Persian
      const colors = [
        { name: "سفید", code: "#FFFFFF" },
        { name: "سیاه", code: "#000000" },
        { name: "قرمز", code: "#FF0000" },
        { name: "آبی", code: "#0000FF" },
        { name: "سبز", code: "#00FF00" },
        { name: "زرد", code: "#FFFF00" },
        { name: "بنفش", code: "#800080" },
        { name: "نارنجی", code: "#FFA500" },
        { name: "صورتی", code: "#FFC0CB" },
        { name: "قهوه‌ای", code: "#8B4513" },
        { name: "خاکستری", code: "#808080" },
        { name: "نقرهای", code: "#C0C0C0" },
        { name: "طلایی", code: "#FFD700" },
        { name: "برنزی", code: "#CD7F32" },
        { name: "فیروزهای", code: "#40E0D0" },
        { name: "یاسی", code: "#E6E6FA" },
        { name: "کرم", code: "#FFFDD0" },
        { name: "بژ", code: "#F5F5DC" },
        { name: "شیری", code: "#FFF5E1" },
        { name: "مشکی", code: "#1C1C1C" },
        { name: "سورمه‌ای", code: "#000080" },
        { name: "سبز تیره", code: "#006400" },
        { name: "ارغوانی", code: "#800080" },
        { name: "زرشکی", code: "#800000" },
        { name: "نیلی", code: "#4B0082" },
        { name: "آبی آسمانی", code: "#87CEEB" },
        { name: "سبز زیتونی", code: "#808000" },
        { name: "صورتی تیره", code: "#DB7093" },
        { name: "قهوه‌ای روشن", code: "#DEB887" },
        { name: "خاکستری روشن", code: "#D3D3D3" },
        { name: "آبی تیره", code: "#00008B" },
        { name: "سبز روشن", code: "#90EE90" },
        { name: "زرد طلایی", code: "#DAA520" },
        { name: "صورتی روشن", code: "#FFB6C1" },
        { name: "قهوه‌ای تیره", code: "#654321" },
        { name: "خاکستری تیره", code: "#404040" },
        { name: "آبی فیروزه‌ای", code: "#40E0D0" },
        { name: "سبز لیمویی", code: "#32CD32" },
        { name: "زرد لیمویی", code: "#FFFACD" },
        { name: "صورتی پاستلی", code: "#FFD1DC" },
        { name: "قهوه‌ای روشن", code: "#D2B48C" },
        { name: "خاکستری مایل به آبی", code: "#B0C4DE" },
        { name: "آبی پودری", code: "#B0E0E6" },
        { name: "سبز پودری", code: "#98FB98" },
        { name: "زرد پودری", code: "#F0E68C" },
        { name: "صورتی پودری", code: "#FFE4E1" },
        { name: "قهوه‌ای پودری", code: "#DEB887" },
        { name: "خاکستری پودری", code: "#E6E6FA" },
        { name: "آبی تیره مایل به سبز", code: "#006400" },
        { name: "سبز تیره مایل به آبی", code: "#004225" },
      ];

      // Models in Persian
      const models = [
        { name: "کلاسیک" },
        { name: "مدرن" },
        { name: "مینیمال" },
        { name: "رترو" },
        { name: "اسپرت" },
        { name: "کاجوال" },
        { name: "رسمی" },
        { name: "پارتی" },
        { name: "ورزشی" },
        { name: "بوهو" },
      ];

      // Sizes (in English as requested)
      const sizes = [
        { name: "XS" },
        { name: "S" },
        { name: "M" },
        { name: "L" },
        { name: "XL" },
        { name: "XXL" },
        { name: "XXXL" },
        { name: "36" },
        { name: "37" },
        { name: "38" },
        { name: "39" },
        { name: "40" },
        { name: "41" },
        { name: "42" },
        { name: "43" },
      ];

      let successCount = 0;

      // Insert colors
      for (const color of colors) {
        try {
          await knex("product_variation_colors").insert({
            title: color.name,
            color_code: color.code,
            created_at: new Date(),
            updated_at: new Date(),
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to insert color: ${color.name}`, error.message);
        }
      }

      console.log(`Successfully inserted ${successCount} colors.`);
      successCount = 0;

      // Insert models
      for (const model of models) {
        try {
          await knex("product_variation_models").insert({
            title: model.name,
            created_at: new Date(),
            updated_at: new Date(),
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to insert model: ${model.name}`, error.message);
        }
      }

      console.log(`Successfully inserted ${successCount} models.`);
      successCount = 0;

      // Insert sizes
      for (const size of sizes) {
        try {
          await knex("product_variation_sizes").insert({
            title: size.name,
            created_at: new Date(),
            updated_at: new Date(),
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to insert size: ${size.name}`, error.message);
        }
      }

      console.log(`Successfully inserted ${successCount} sizes.`);
      console.log("Product variations migration completed successfully.");
    } catch (error) {
      console.error("Error during product variations migration:", error);
      throw error;
    }
  },
};
