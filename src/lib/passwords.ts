import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashServerPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyServerPassword(password: string, hash?: string, legacyPlaintext?: string): boolean {
  if (hash?.startsWith('scrypt$')) {
    const [, salt, digest] = hash.split('$');
    if (!salt || !digest || !/^[a-f0-9]{128}$/.test(digest)) return false;
    const expected = Buffer.from(digest, 'hex');
    return timingSafeEqual(expected, scryptSync(password, salt, 64));
  }
  // Both historical formats exist in this application. Never accept a hash as a password.
  const clientHash = createHash('sha256').update(`salt_4tacia_calle_larga_${password}`).digest('hex');
  const serverHash = createHash('sha256').update(`${password}bomberos_calle_larga_4ta_sec_2026`).digest('hex');
  return Boolean(hash && (hash === clientHash || hash === serverHash)) || Boolean(legacyPlaintext && legacyPlaintext === password);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 12 && password.length <= 128 && /[A-Z]/.test(password)
    && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9\s]/.test(password);
}
