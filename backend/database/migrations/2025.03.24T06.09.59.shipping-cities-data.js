/**
 * Migration `shipping-cities-data`
 */

const fs = require("fs");
const path = require("path");

/**
 * Imports cities from iran-cities.json and creates relationships with provinces
 */
module.exports = {
  async up(knex) {
    try {
      // Read the JSON file with cities data
      const citiesDataPath = path.resolve(__dirname, "..", "iran-cities.json");
      const citiesData = JSON.parse(fs.readFileSync(citiesDataPath, "utf8"));

      // Get all existing provinces from the database
      const provinces = await knex("shipping_provinces").select("id", "title");

      if (provinces.length === 0) {
        console.error(
          "No provinces found in the database. Please run the province migration first."
        );
        return;
      }

      // Log the first province to see its structure
      console.log("Sample province structure:", provinces[0]);

      // Create a map of province titles to their IDs for quick lookup
      const provinceMap = {};
      for (const province of provinces) {
        // Try multiple property names to handle potential case sensitivity issues
        const title = province.title;

        if (title) {
          provinceMap[title] = province.id;
        }
      }

      // Map to track inserted cities
      const cityIdMap = {};
      let successCount = 0;

      // Process each province and its cities
      for (const provinceData of citiesData) {
        const provinceTitle = provinceData.province;
        const provinceId = provinceMap[provinceTitle];

        if (!provinceId) {
          console.warn(`Province not found in database: ${provinceTitle}`);
          continue;
        }

        console.log(
          `Processing province: ${provinceTitle} (ID: ${provinceId})`
        );

        // Process each city for this province
        for (const cityName of provinceData.cities) {
          try {
            // First, insert the city record
            const [cityId] = await knex("shipping_cities")
              .insert({
                title: cityName,
                created_at: new Date(),
                updated_at: new Date(),
              })
              .returning("id");

            // If insertion returns the ID directly
            let actualCityId = typeof cityId === "string" ? cityId : cityId?.id;

            // If not, we need to fetch the ID of the just-inserted city
            if (!actualCityId) {
              const insertedCity = await knex("shipping_cities")
                .where({ title: cityName })
                .orderBy("id", "desc")
                .first();

              if (insertedCity) {
                actualCityId = insertedCity.id;
              } else {
                console.warn(
                  `Could not retrieve ID for inserted city: ${cityName}`
                );
                continue;
              }
            }

            // Store the city ID for reference
            cityIdMap[cityName] = actualCityId;

            // Then, create the relationship in the join table
            await knex("shipping_cities_shipping_province_links").insert({
              shipping_city_id: actualCityId,
              shipping_province_id: provinceId,
            });

            successCount++;

            if (successCount % 50 === 0) {
              console.log(`Progress: ${successCount} cities inserted`);
            }
          } catch (error) {
            console.error(`Failed to insert city: ${cityName}`, error.message);
          }
        }
      }

      console.log(
        `Cities migration completed. Successfully inserted ${successCount} cities.`
      );
    } catch (error) {
      console.error("Error during cities migration:", error);
      throw error;
    }
  },
};
