export const COOKIE_NAME = 'admin_session';
const VALUE = 'v1';

function toBase64Url(bytes: ArrayBuffer): string {
  const b64 = Buffer.from(new Uint8Array(bytes)).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return toBase64Url(sig);
}

export async function signAdminCookie(secret: string): Promise<string> {
  const sig = await hmac(secret, VALUE);
  return `${VALUE}.${sig}`;
}

export async function verifyAdminCookie(cookie: string, secret: string): Promise<boolean> {
  if (!cookie || typeof cookie !== 'string') return false;
  const parts = cookie.split('.');
  if (parts.length !== 2) return false;
  const [value, sig] = parts;
  if (value !== VALUE) return false;
  const expected = await hmac(secret, value);
  if (sig.length !== expected.length) return false;

  // Constant-time comparison (Web Crypto doesn't give us timingSafeEqual directly)
  let diff = 0;
  for (let i = 0; i < sig.length; i++) {
    diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
