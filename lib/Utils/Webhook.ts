import crypto from 'crypto';

export function generateRandomToken(): string {
    return crypto.randomBytes(64).toString('hex');
}
