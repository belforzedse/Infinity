import {
  generateOtpCode,
  hashOtpCode,
  hashPassword,
  isBcryptHash,
  verifyOtpCode,
  verifyPassword,
} from '../../src/api/auth/utils/security';

describe('password utilities', () => {
  it('hashPassword returns a bcrypt hash', async () => {
    const hash = await hashPassword('Str0ngPass!');
    expect(isBcryptHash(hash)).toBe(true);
  });

  it('verifyPassword validates hashed passwords', async () => {
    const password = 'Another$ecret1';
    const hash = await hashPassword(password);

    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });

  it('verifyPassword supports legacy plaintext comparison', async () => {
    await expect(verifyPassword('123456', '123456')).resolves.toBe(true);
    await expect(verifyPassword('123456', '654321')).resolves.toBe(false);
  });
});

describe('otp utilities', () => {
  it('generateOtpCode produces six digit codes', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateOtpCode()));

    for (const code of codes) {
      expect(code).toMatch(/^\d{6}$/);
    }

    expect(codes.size).toBeGreaterThan(1);
  });

  it('hashOtpCode and verifyOtpCode validate codes securely', () => {
    const code = '123456';
    const hash = hashOtpCode(code);

    expect(verifyOtpCode(code, hash)).toBe(true);
    expect(verifyOtpCode('654321', hash)).toBe(false);
  });

  it('verifyOtpCode falls back to legacy plaintext tokens', () => {
    expect(verifyOtpCode('123456', undefined, '123456')).toBe(true);
    expect(verifyOtpCode('000000', undefined, '123456')).toBe(false);
  });
});
