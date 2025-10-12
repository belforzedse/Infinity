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

const {
  SNAPPAY_BASE_URL = "https://fms-gateway-staging.apps.public.okd4.teh-1.snappcloud.io",
  SNAPPAY_CLIENT_ID = "infinity",
  SNAPPAY_CLIENT_SECRET = "m7Z*e6RJp#DaWZQc",
  SNAPPAY_USERNAME = "infinity-purchase",
  SNAPPAY_PASSWORD = "J#FFlaz3*#eSpy5N",
} = process.env;

async function fetchAccessToken(http) {
  const body = new URLSearchParams();
  body.append("grant_type", "password");
  body.append("scope", "online-merchant");
  body.append("username", SNAPPAY_USERNAME);
  body.append("password", SNAPPAY_PASSWORD);

  const basic = Buffer.from(`${SNAPPAY_CLIENT_ID}:${SNAPPAY_CLIENT_SECRET}`).toString(
    "base64"
  );

  const { data } = await http.post("/api/online/v1/oauth/token", body.toString(), {
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
