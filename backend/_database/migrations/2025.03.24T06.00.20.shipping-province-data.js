/**
 * Migration `shipping-province-data` - Add Iranian provinces
 */

module.exports = {
  /**
   * Run the migrations: Add all Iranian provinces
   */
  async up(knex) {
    // Iranian provinces data in Persian
    const iranianProvinces = [
      "تهران", // Tehran
      "اصفهان", // Isfahan
      "فارس", // Fars
      "خراسان رضوی", // Khorasan Razavi
      "آذربایجان شرقی", // East Azerbaijan
      "آذربایجان غربی", // West Azerbaijan
      "گیلان", // Gilan
      "مازندران", // Mazandaran
      "کرمان", // Kerman
      "خوزستان", // Khuzestan
      "البرز", // Alborz
      "یزد", // Yazd
      "قم", // Qom
      "سیستان و بلوچستان", // Sistan and Baluchestan
      "کرمانشاه", // Kermanshah
      "هرمزگان", // Hormozgan
      "اردبیل", // Ardabil
      "قزوین", // Qazvin
      "مرکزی", // Markazi
      "زنجان", // Zanjan
      "گلستان", // Golestan
      "لرستان", // Lorestan
      "همدان", // Hamedan
      "کردستان", // Kurdistan
      "بوشهر", // Bushehr
      "خراسان جنوبی", // South Khorasan
      "چهارمحال و بختیاری", // Chaharmahal and Bakhtiari
      "سمنان", // Semnan
      "ایلام", // Ilam
      "خراسان شمالی", // North Khorasan
      "کهگیلویه و بویراحمد", // Kohgiluyeh and Boyer-Ahmad
    ];

    // Insert provinces
    for (const provinceName of iranianProvinces) {
      // Check if province already exists
      const existingProvince = await knex("shipping_provinces")
        .where({ title: provinceName })
        .first();

      if (!existingProvince) {
        await knex("shipping_provinces").insert({
          title: provinceName,
          created_at: new Date(),
          updated_at: new Date(),
        });

        console.log(`Added province: ${provinceName}`);
      } else {
        console.log(`Province already exists: ${provinceName}`);
      }
    }

    console.log("Iranian provinces migration completed successfully");
  },
};
