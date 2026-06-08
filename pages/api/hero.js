import prisma from '../../lib/prisma';

const KEYS = ['heroImageUrl', 'heroBadgeText', 'heroTitle', 'heroSubtitle', 'logoUrl'];

export default async function handler(req, res) {
  const rows = await prisma.siteConfig.findMany({ where: { key: { in: KEYS } } });
  const config = {};
  rows.forEach(r => { config[r.key] = r.value; });
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
  return res.json(config);
}
