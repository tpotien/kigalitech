import prisma from '../../lib/prisma';

const KEYS = ['heroImageUrl', 'heroBadgeText', 'heroTitle', 'heroSubtitle', 'logoUrl'];

export default async function handler(req, res) {
  const rows = await prisma.siteConfig.findMany({ where: { key: { in: KEYS } } });
  const config = {};
  rows.forEach(r => { config[r.key] = r.value; });
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res.json(config);
}
