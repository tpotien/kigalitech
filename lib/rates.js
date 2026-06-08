import prisma from './prisma';

let _cached = 1475;
let _fetchedAt = 0;

export async function getUsdToRwf() {
  const now = Date.now();
  if (now - _fetchedAt < 60_000) return _cached;
  const row = await prisma.siteConfig.findUnique({ where: { key: 'usdToRwf' } }).catch(() => null);
  _cached = row ? Number(row.value) : 1475;
  _fetchedAt = now;
  return _cached;
}

export function fmtRwf(cents, rate = 1475) {
  return `RWF ${Math.round((cents / 100) * rate).toLocaleString()}`;
}
