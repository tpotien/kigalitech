import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const row = await prisma.siteConfig.findUnique({ where: { key: 'usdToRwf' } });
  const usdToRwf = row ? Number(row.value) : 1475;
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  return res.json({ usdToRwf });
}
