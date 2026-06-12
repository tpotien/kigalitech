import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { path } = req.body || {};
  if (!path || typeof path !== 'string') return res.status(400).end();
  // Strip query strings, limit length
  const cleanPath = path.split('?')[0].slice(0, 255);
  // Ignore admin/api routes
  if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/api')) return res.status(204).end();
  await prisma.pageView.create({ data: { path: cleanPath } });
  res.status(204).end();
}
