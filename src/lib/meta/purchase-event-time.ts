export function getPurchaseEventTime(paidAt: string | null | undefined, now = Date.now()) {
  const timestamp = paidAt ? Date.parse(paidAt) : Number.NaN;

  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : Math.floor(now / 1000);
}
