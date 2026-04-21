export const HEARTBEAT_GRACE_MS = 15_000;

export function computeCredit(
  now: Date,
  last: Date | null,
  graceMs: number = HEARTBEAT_GRACE_MS,
): number {
  if (!last) return 0;
  const gap = now.getTime() - last.getTime();
  if (gap <= 0) return 0;
  if (gap > graceMs) return 0;
  return gap;
}
