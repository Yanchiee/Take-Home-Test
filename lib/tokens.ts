import { randomBytes } from 'crypto';

export function generateResumeToken(): string {
  return randomBytes(24).toString('base64url');
}
