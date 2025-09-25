import bcrypt from "bcryptjs";
import crypto from "crypto";

const DEFAULT_SALT_ROUNDS = 12;

function resolveSaltRounds(): number {
  const configured = Number(process.env.PASSWORD_SALT_ROUNDS);

  if (!Number.isFinite(configured) || configured < 4) {
    return DEFAULT_SALT_ROUNDS;
  }

  return Math.min(configured, 31);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(resolveSaltRounds());
  return bcrypt.hash(password, salt);
}

export function isBcryptHash(value?: string | null): boolean {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

export async function verifyPassword(
  candidate: string,
  stored?: string | null
): Promise<boolean> {
  if (!stored) {
    return false;
  }

  if (isBcryptHash(stored)) {
    return bcrypt.compare(candidate, stored);
  }

  const storedBuffer = Buffer.from(stored);
  const candidateBuffer = Buffer.from(candidate);

  if (storedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, candidateBuffer);
}

export async function ensurePasswordHash(
  password: string | null | undefined
): Promise<string | null | undefined> {
  if (!password) {
    return password;
  }

  if (isBcryptHash(password)) {
    return password;
  }

  return hashPassword(password);
}

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function generateOtpToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(9).toString("base64url");
  return `${timestamp}.${randomPart}`;
}

function deriveOtpDigest(code: string): Buffer {
  return crypto.createHash("sha256").update(code).digest();
}

export function hashOtpCode(code: string): string {
  return deriveOtpDigest(code).toString("base64");
}

export function verifyOtpCode(
  candidate: string,
  storedHash?: string | null,
  legacyCode?: string | null
): boolean {
  if (storedHash) {
    const storedBuffer = Buffer.from(storedHash, "base64");
    const candidateBuffer = deriveOtpDigest(candidate);

    if (storedBuffer.length !== candidateBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  }

  if (legacyCode) {
    const storedBuffer = Buffer.from(legacyCode);
    const candidateBuffer = Buffer.from(candidate);

    if (storedBuffer.length !== candidateBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
  }

  return false;
}
