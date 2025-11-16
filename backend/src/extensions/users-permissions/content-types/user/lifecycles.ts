import bcrypt from "bcryptjs";

const HASH_SALT_ROUNDS = 12;

function isBcryptHash(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    // bcrypt.getRounds throws if the string is not a bcrypt hash
    return bcrypt.getRounds(value) > 0;
  } catch {
    return false;
  }
}

async function ensurePasswordIsHashed(password: string): Promise<string> {
  if (isBcryptHash(password)) {
    return password;
  }
  return bcrypt.hash(password, HASH_SALT_ROUNDS);
}

async function hashPasswordIfPresent(data: Record<string, any> = {}) {
  if (typeof data.password !== "string" || data.password.length === 0) {
    return;
  }

  data.password = await ensurePasswordIsHashed(data.password);
}

export default {
  async beforeCreate(event: any) {
    await hashPasswordIfPresent(event.params?.data);
  },

  async beforeUpdate(event: any) {
    await hashPasswordIfPresent(event.params?.data);
  },
};
