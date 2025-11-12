#!/usr/bin/env node
/**
 * Quick helper to verify the state of a SnappPay order before re-running Scenario 1.
 *
 * Usage:
 *   node scripts/check-snappay-status.js <paymentToken> [transactionId]
 *
 * It will:
 *   1) Fetch an access token using the configured SNAPPAY_* environment variables.
 *   2) Call the SnappPay status endpoint with the provided payment token.
 *   3) Optionally print a reminder if the transactionId returned by SnappPay doesn't
 *      match the one supplied.
 */

const axios = require("axios");
const qs = require("qs");

const {
  SNAPPAY_BASE_URL,
  SNAPPAY_CLIENT_ID,
  SNAPPAY_CLIENT_SECRET,
  SNAPPAY_USERNAME,
  SNAPPAY_PASSWORD,
} = process.env;

if (
  !SNAPPAY_BASE_URL ||
  !SNAPPAY_CLIENT_ID ||
  !SNAPPAY_CLIENT_SECRET ||
  !SNAPPAY_USERNAME ||
  !SNAPPAY_PASSWORD
) {
  console.error("Missing SNAPPAY_* environment variables. Please load main.env/dev.env first.");
  process.exit(1);
}

async function fetchAccessToken(http) {
  const body = qs.stringify({
    grant_type: "password",
    scope: "online-merchant",
    username: SNAPPAY_USERNAME,
    password: SNAPPAY_PASSWORD,
  });

  const basic = Buffer.from(`${SNAPPAY_CLIENT_ID}:${SNAPPAY_CLIENT_SECRET}`).toString(
    "base64"
  );

  const { data } = await http.post("/api/online/v1/oauth/token", body, {
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 20_000,
  });

  return data?.access_token;
}

async function main() {
  const [, , paymentToken, transactionId] = process.argv;

  if (!paymentToken) {
    console.error(
      "Usage: node scripts/check-snappay-status.js <paymentToken> [transactionId]"
    );
    process.exit(1);
  }

  const http = axios.create({ baseURL: SNAPPAY_BASE_URL });

  try {
    const accessToken = await fetchAccessToken(http);
    if (!accessToken) {
      throw new Error("Failed to obtain SnappPay access token");
    }

    const statusRes = await http.get("/api/online/payment/v1/status", {
      params: { paymentToken },
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 15_000,
    });

    console.log("SnappPay status:", JSON.stringify(statusRes.data, null, 2));

    const remoteTxnId = statusRes.data?.response?.transactionId;
    if (transactionId && remoteTxnId && remoteTxnId !== transactionId) {
      console.warn(
        `Warning: transactionId mismatch. Provided "${transactionId}" but SnappPay reports "${remoteTxnId}".`
      );
    }
  } catch (error) {
    if (error.response) {
      console.error(
        `SnappPay status call failed (${error.response.status}):`,
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("SnappPay status call failed:", error.message);
    }
    process.exit(1);
  }
}

main();
