import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Hash a token with SHA-256 for secure storage.
 * Used for verification tokens and password reset tokens.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Derive an encryption key from AUTH_SECRET using SHA-256.
 * Returns a 32-byte key suitable for AES-256.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required for encryption');
  }
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns a string in format: iv:authTag:encrypted (all hex encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt().
 * Expects format: iv:authTag:encrypted (all hex encoded).
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Check if a string looks like encrypted data (has the iv:authTag:encrypted format).
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/.test(p));
}
