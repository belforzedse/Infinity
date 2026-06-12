import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { authCredentials, authStateDir, authStorageStatePath, type E2EAuthRole } from "../helpers/auth";
import { storefrontBaseURL, strapiApiURL, strapiOrigin } from "../helpers/env";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1] = {},
  timeoutMs = 15_000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForEndpoint(url: string, timeoutMs: number) {
  const started = Date.now();
  let lastError = "";

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: { Accept: "application/json" },
      }, 10_000);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for ${url}. Last error: ${lastError}`);
}

type SeedSummary = {
  customerUserId?: number;
  adminUserId?: number;
};

function runCommand(command: string) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, {
      cwd: repoRoot,
      env: process.env,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout?.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr?.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed (${code}): ${command}`));
      }
    });
  });
}

function parseSeedSummary(output: string): SeedSummary {
  const jsonStart = output.lastIndexOf("\n{");
  const jsonText = jsonStart >= 0 ? output.slice(jsonStart + 1).trim() : output.trim();
  if (!jsonText.startsWith("{")) {
    throw new Error("E2E seed command did not print a JSON summary");
  }

  return JSON.parse(jsonText) as SeedSummary;
}

async function readBackendEnvValue(name: string) {
  const existing = process.env[name]?.trim();
  if (existing) return existing;

  const envPath = path.join(repoRoot, "apps/backend/.env");
  const content = await readFile(envPath, "utf8").catch(() => "");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex < 0) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    if (key !== name) continue;
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    return rawValue.replace(/^['"]|['"]$/g, "");
  }

  throw new Error(`Missing ${name}; set it in the environment or apps/backend/.env`);
}

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function issueJwt(userId: number, secret: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    id: userId,
    iat: issuedAt,
    exp: issuedAt + 7 * 24 * 60 * 60,
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
}

function resolveSeededUserId(role: E2EAuthRole, seedSummary?: SeedSummary) {
  const envName = role === "customer" ? "E2E_CUSTOMER_USER_ID" : "E2E_ADMIN_USER_ID";
  const envValue = Number(process.env[envName]);
  const seedValue = role === "customer" ? seedSummary?.customerUserId : seedSummary?.adminUserId;
  const userId = Number.isFinite(envValue) && envValue > 0 ? envValue : seedValue;

  if (!Number.isFinite(userId) || !userId) {
    throw new Error(
      `Missing E2E ${role} user id; run the E2E seed or set ${envName} when E2E_SEED_MODE=skip`,
    );
  }

  return Number(userId);
}

async function writeAuthStorageStateFromToken(role: E2EAuthRole, token: string) {
  const authCheck = await fetchWithTimeout(`${strapiApiURL()}/auth/self`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  }, 15_000);
  if (!authCheck.ok) {
    const body = await authCheck.text().catch(() => "");
    throw new Error(
      `E2E ${role} token validation failed (${authCheck.status} ${authCheck.statusText}): ${body}`,
    );
  }

  await mkdir(authStateDir, { recursive: true });
  await writeFile(
    authStorageStatePath(role),
    JSON.stringify(
      {
        cookies: [],
        origins: [
          {
            origin: storefrontBaseURL(),
            localStorage: [
              { name: "accessToken", value: token },
              { name: "analytics-consent", value: "denied" },
              { name: "pdp_debug", value: "0" },
            ],
          },
        ],
      },
      null,
      2,
    ),
  );
}

async function writeAuthStorageStateViaLogin(role: E2EAuthRole) {
  const credentials = authCredentials(role);
  const response = await fetchWithTimeout(`${strapiApiURL()}/auth/login-with-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  }, 15_000);

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `E2E ${role} login failed (${response.status} ${response.statusText}): ${body}`,
    );
  }

  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new Error(`E2E ${role} login did not return a token`);
  }

  await mkdir(authStateDir, { recursive: true });
  await writeFile(
    authStorageStatePath(role),
    JSON.stringify(
      {
        cookies: [],
        origins: [
          {
            origin: storefrontBaseURL(),
            localStorage: [
              { name: "accessToken", value: payload.token },
              { name: "analytics-consent", value: "denied" },
              { name: "pdp_debug", value: "0" },
            ],
          },
        ],
      },
      null,
      2,
    ),
  );
}

async function writeAuthStorageState(role: E2EAuthRole, seedSummary?: SeedSummary) {
  if (process.env.E2E_AUTH_MODE === "login") {
    await writeAuthStorageStateViaLogin(role);
    return;
  }

  const userId = resolveSeededUserId(role, seedSummary);
  const jwtSecret = await readBackendEnvValue("JWT_SECRET");
  await writeAuthStorageStateFromToken(role, issueJwt(userId, jwtSecret));
}

export default async function globalSetup() {
  if (process.env.E2E_SKIP_SERVICE_WAIT !== "1") {
    const healthUrl = process.env.E2E_API_HEALTH_URL || `${strapiOrigin()}/_health`;
    await waitForEndpoint(healthUrl, Number(process.env.E2E_SERVICE_TIMEOUT_MS || 120_000));
  }

  const seedMode = process.env.E2E_SEED_MODE || "auto";
  let seedSummary: SeedSummary | undefined;
  if (seedMode !== "skip") {
    const command =
      process.env.E2E_AUTO_SEED_COMMAND || "pnpm --filter @repo/backend seed:e2e";
    const result = await runCommand(command);
    seedSummary = parseSeedSummary(result.stdout);
  }

  if (process.env.E2E_AUTH_MODE !== "skip") {
    await writeAuthStorageState("customer", seedSummary);
    await writeAuthStorageState("admin", seedSummary);
  }
}
