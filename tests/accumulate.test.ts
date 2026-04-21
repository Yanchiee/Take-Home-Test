import { describe, it, expect } from 'vitest';
import { computeCredit } from '../lib/accumulate';

const GRACE_MS = 15_000;

describe('computeCredit', () => {
  it('credits a normal 10s gap', () => {
    const now = new Date('2026-04-21T10:00:10Z');
    const last = new Date('2026-04-21T10:00:00Z');
    expect(computeCredit(now, last, GRACE_MS)).toBe(10_000);
  });

  it('credits the full gap at the grace boundary (15s)', () => {
    const now = new Date('2026-04-21T10:00:15Z');
    const last = new Date('2026-04-21T10:00:00Z');
    expect(computeCredit(now, last, GRACE_MS)).toBe(15_000);
  });

  it('credits zero when the gap exceeds grace (16s)', () => {
    const now = new Date('2026-04-21T10:00:16Z');
    const last = new Date('2026-04-21T10:00:00Z');
    expect(computeCredit(now, last, GRACE_MS)).toBe(0);
  });

  it('credits zero on the very first heartbeat (no previous)', () => {
    const now = new Date('2026-04-21T10:00:10Z');
    expect(computeCredit(now, null, GRACE_MS)).toBe(0);
  });

  it('credits zero for a long idle gap (5 minutes)', () => {
    const now = new Date('2026-04-21T10:05:00Z');
    const last = new Date('2026-04-21T10:00:00Z');
    expect(computeCredit(now, last, GRACE_MS)).toBe(0);
  });

  it('never returns a negative value even if clocks skew backwards', () => {
    const now = new Date('2026-04-21T10:00:00Z');
    const last = new Date('2026-04-21T10:00:05Z');
    expect(computeCredit(now, last, GRACE_MS)).toBe(0);
  });
});
