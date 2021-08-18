import crypto from 'crypto';

// eslint-disable-next-line import/prefer-default-export
export function generateRandomToken(): string {
  return crypto.randomBytes(64).toString('hex');
}
