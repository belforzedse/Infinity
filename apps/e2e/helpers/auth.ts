import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  E2E_DEFAULT_ADMIN_PASSWORD,
  E2E_DEFAULT_ADMIN_PHONE,
  E2E_DEFAULT_CUSTOMER_PASSWORD,
  E2E_DEFAULT_CUSTOMER_PHONE,
} from "../fixtures/storefront";

export type E2EAuthRole = "customer" | "admin";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const authStateDir = path.resolve(currentDir, "../.auth");

export function authStorageStatePath(role: E2EAuthRole) {
  return path.join(authStateDir, `${role}.json`);
}

export function authCredentials(role: E2EAuthRole) {
  if (role === "admin") {
    return {
      phone: process.env.E2E_ADMIN_PHONE?.trim() || E2E_DEFAULT_ADMIN_PHONE,
      password: process.env.E2E_ADMIN_PASSWORD?.trim() || E2E_DEFAULT_ADMIN_PASSWORD,
    };
  }

  return {
    phone: process.env.E2E_CUSTOMER_PHONE?.trim() || E2E_DEFAULT_CUSTOMER_PHONE,
    password: process.env.E2E_CUSTOMER_PASSWORD?.trim() || E2E_DEFAULT_CUSTOMER_PASSWORD,
  };
}
