/**
 * Extract WooCommerce Guest Orders SnappPay Data
 *
 * This script queries WooCommerce REST API to extract SnappPay payment data
 * from guest orders (orders without registered users) since November 27, 2025.
 * Outputs to JSON file to help fix phone number registration issues.
 */

const path = require("path");
const fs = require("fs");
const config = require("./woocommerce-importer/config");
const { WooCommerceClient } = require("./woocommerce-importer/utils/ApiClient");
const Logger = require("./woocommerce-importer/utils/Logger");

// Initialize logger
const logger = new Logger({ level: "info" });

// Initialize WooCommerce client
const wooClient = new WooCommerceClient(config, logger);

/**
 * Extract SnappPay token from order meta_data
 */
function extractSnappPayToken(order) {
  if (!order.meta_data || !Array.isArray(order.meta_data)) {
    return null;
  }

  // Try _order_spp_token first, then _paymentToken
  const tokenMeta = order.meta_data.find(
    (meta) => meta.key === "_order_spp_token" || meta.key === "_paymentToken",
  );

  return tokenMeta ? tokenMeta.value : null;
}

/**
 * Extract transaction ID from order meta_data
 */
function extractTransactionId(order) {
  if (!order.meta_data || !Array.isArray(order.meta_data)) {
    return null;
  }

  const txMeta = order.meta_data.find((meta) => meta.key === "_transactionId");
  return txMeta ? txMeta.value : null;
}

/**
 * Guess user name from billing or shipping information
 */
function guessUserName(order) {
  // Try billing first
  if (order.billing) {
    const firstName = order.billing.first_name || "";
    const lastName = order.billing.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      return fullName;
    }
  }

  // Fallback to shipping
  if (order.shipping) {
    const firstName = order.shipping.first_name || "";
    const lastName = order.shipping.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      return fullName;
    }
  }

  return "نامشخص"; // Unknown
}

/**
 * Write results to JSON file (append mode)
 */
function writeResultsToFile(outputPath, results, isFirstWrite = false) {
  try {
    if (isFirstWrite) {
      // Initialize file with opening bracket
      fs.writeFileSync(outputPath, "[\n", "utf8");
    } else {
      // Read existing content, remove closing bracket, add comma
      const content = fs.readFileSync(outputPath, "utf8");
      const trimmed = content.trim();
      if (trimmed.endsWith("]")) {
        const withoutBracket = trimmed.slice(0, -1).trim();
        // Remove trailing comma if exists
        const cleaned = withoutBracket.endsWith(",")
          ? withoutBracket.slice(0, -1).trim()
          : withoutBracket;
        fs.writeFileSync(outputPath, cleaned + ",\n", "utf8");
      }
    }

    // Format and append new results
    const jsonContent = results
      .map((result) => {
        const json = JSON.stringify(result, null, 2);
        // Indent each line (add 2 spaces) for proper JSON formatting
        const indented = json
          .split("\n")
          .map((line, i) => (i === 0 ? line : "  " + line))
          .join("\n");
        return indented;
      })
      .join(",\n");

    fs.appendFileSync(outputPath, jsonContent, "utf8");

    // Add closing bracket
    fs.appendFileSync(outputPath, "\n]", "utf8");

    return true;
  } catch (error) {
    logger.error(`❌ Error writing to file:`, error.message);
    return false;
  }
}

/**
 * Process a single order and return formatted result
 */
function processOrder(order) {
  const snappPayToken = extractSnappPayToken(order);
  const transactionId = extractTransactionId(order);

  // Skip if no SnappPay token found
  if (!snappPayToken) {
    return null;
  }

  const guessedUserName = guessUserName(order);

  return {
    orderId: order.id,
    orderDate: order.date_created,
    guessedUserName: guessedUserName,
    snappPayToken: snappPayToken,
    transactionId: transactionId || null,
    billing: {
      first_name: order.billing?.first_name || "",
      last_name: order.billing?.last_name || "",
      phone: order.billing?.phone || "",
      email: order.billing?.email || "",
      address_1: order.billing?.address_1 || "",
      address_2: order.billing?.address_2 || "",
      city: order.billing?.city || "",
      state: order.billing?.state || "",
      postcode: order.billing?.postcode || "",
      country: order.billing?.country || "",
    },
    shipping: {
      first_name: order.shipping?.first_name || "",
      last_name: order.shipping?.last_name || "",
      address_1: order.shipping?.address_1 || "",
      address_2: order.shipping?.address_2 || "",
      city: order.shipping?.city || "",
      state: order.shipping?.state || "",
      postcode: order.shipping?.postcode || "",
      country: order.shipping?.country || "",
    },
    total: order.total,
    status: order.status,
    payment_method: order.payment_method,
    payment_method_title: order.payment_method_title,
  };
}

/**
 * Query WooCommerce orders with pagination and write incrementally
 */
async function fetchAndProcessOrders(outputPath) {
  let page = 1;
  const perPage = 100;
  // Note: If you meant November 27, 2024, change this to '2024-11-27T00:00:00'
  const startDate = "2025-11-27T00:00:00"; // November 27, 2025 - NO orders before this date
  const endDate = new Date().toISOString(); // Today (current date/time)

  let totalProcessed = 0;
  let totalWritten = 0;
  let isFirstWrite = true;

  logger.info("🔍 Starting to fetch orders from WooCommerce...");
  logger.info(`   Filter: orders WITHOUT phone numbers`);
  logger.info(`   Status: processing (در حال انجام) OR completed (انجام شده)`);
  logger.info(
    `   Date range: FROM ${startDate} (no orders before this date) TO ${endDate} (today)`,
  );
  logger.info(`   Payment method: WC_Gateway_SnappPay`);
  logger.info(`   Writing to: ${outputPath}`);

  while (true) {
    try {
      logger.info(`📄 Fetching page ${page}...`);

      const response = await wooClient.client.get("/orders", {
        params: {
          after: startDate, // Only orders AFTER Nov 27, 2025 (excludes orders before)
          before: endDate, // Up to today
          payment_method: "WC_Gateway_SnappPay",
          status: "processing,completed", // Only processing (در حال انجام) and completed (انجام شده) orders
          per_page: perPage,
          page: page,
          orderby: "date",
          order: "desc",
        },
      });

      const orders = response.data || [];

      if (orders.length === 0) {
        logger.info(`   No more orders found on page ${page}`);
        break;
      }

      logger.info(`   Found ${orders.length} orders on page ${page}`);

      // Filter for orders WITHOUT phone numbers, SnappPay, and specific statuses
      const ordersWithoutPhone = orders.filter(
        (order) =>
          order.payment_method === "WC_Gateway_SnappPay" &&
          (!order.billing?.phone || order.billing.phone.trim() === "") &&
          (order.status === "processing" || order.status === "completed"),
      );

      logger.info(
        `   Filtered: ${ordersWithoutPhone.length} orders without phone numbers (processing/completed only)`,
      );

      // Process orders and extract SnappPay data
      const results = [];
      for (const order of ordersWithoutPhone) {
        const result = processOrder(order);
        if (result) {
          results.push(result);
          totalProcessed++;
        }
      }

      // Write results incrementally
      if (results.length > 0) {
        writeResultsToFile(outputPath, results, isFirstWrite);
        totalWritten += results.length;
        isFirstWrite = false;
        logger.info(`   ✅ Written ${results.length} orders to file (total: ${totalWritten})`);
      }

      // Check if there are more pages
      const totalPages = parseInt(response.headers["x-wp-totalpages"] || "1", 10);
      if (page >= totalPages) {
        break;
      }

      page++;
    } catch (error) {
      logger.error(`❌ Error fetching orders on page ${page}:`, error.message);
      if (error.response) {
        logger.error(`   Status: ${error.response.status}`);
        logger.error(`   Data:`, JSON.stringify(error.response.data));
      }
      break;
    }
  }

  logger.info(`✅ Total orders processed: ${totalProcessed}`);
  logger.info(`✅ Total orders written to file: ${totalWritten}`);
  return { totalProcessed, totalWritten };
}

/**
 * Main execution
 */
async function main() {
  try {
    logger.info("🚀 Starting WooCommerce Guest Orders SnappPay Data Extraction");
    logger.info("=".repeat(60));

    // Initialize output file path
    const outputPath = path.join(__dirname, "woocommerce-guest-orders-snapppay-data.json");

    // Fetch, process, and write orders incrementally
    const { totalProcessed, totalWritten } = await fetchAndProcessOrders(outputPath);

    if (totalWritten === 0) {
      logger.warn("⚠️  No orders with SnappPay tokens found");
      // Clean up empty file
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      return;
    }

    logger.success(`✅ Successfully extracted ${totalWritten} orders`);
    logger.success(`📄 Output written to: ${outputPath}`);

    // Print summary
    logger.info("\n📊 Summary:");
    logger.info(`   Total orders processed: ${totalProcessed}`);
    logger.info(`   Orders written to file: ${totalWritten}`);

    // Read and show sample from file
    try {
      const fileContent = fs.readFileSync(outputPath, "utf8");
      const results = JSON.parse(fileContent);
      if (results.length > 0) {
        logger.info("\n📋 Sample output (first order):");
        const sample = results[0];
        logger.info(`   Order ID: ${sample.orderId}`);
        logger.info(`   Date: ${sample.orderDate}`);
        logger.info(`   User Name: ${sample.guessedUserName}`);
        logger.info(`   SnappPay Token: ${sample.snappPayToken}`);
        logger.info(`   Transaction ID: ${sample.transactionId || "N/A"}`);
        logger.info(`   Phone: ${sample.billing.phone || "N/A"}`);
      }
    } catch (parseError) {
      logger.warn("⚠️  Could not parse output file for sample display");
    }
  } catch (error) {
    logger.error("❌ Fatal error:", error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      logger.info("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("\n❌ Script failed:", error.message);
      process.exit(1);
    });
}

module.exports = { main };
