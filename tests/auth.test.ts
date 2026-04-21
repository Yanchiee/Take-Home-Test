import { describe, it, expect } from 'vitest';
import { signAdminCookie, verifyAdminCookie } from '../lib/auth';

const SECRET = 'test-secret-12345';

describe('admin cookie', () => {
  it('round-trips a valid cookie', async () => {
    const cookie = await signAdminCookie(SECRET);
    expect(await verifyAdminCookie(cookie, SECRET)).toBe(true);
  });

  it('rejects a tampered cookie', async () => {
    const cookie = await signAdminCookie(SECRET);
    const tampered = cookie.slice(0, -2) + 'xx';
    expect(await verifyAdminCookie(tampered, SECRET)).toBe(false);
  });

  it('rejects a cookie signed with a different secret', async () => {
    const cookie = await signAdminCookie('other-secret');
    expect(await verifyAdminCookie(cookie, SECRET)).toBe(false);
  });

  it('rejects garbage input', async () => {
    expect(await verifyAdminCookie('not-a-cookie', SECRET)).toBe(false);
    expect(await verifyAdminCookie('', SECRET)).toBe(false);
  });
});
