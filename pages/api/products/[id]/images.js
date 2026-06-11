import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = Number(req.query.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const product = await prisma.product.findUnique({
    where: { id },
    select: { images: true, colorImages: true },
  });
  if (!product) return res.status(404).json({ error: 'Not found' });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.json({ images: product.images, colorImages: product.colorImages });
}
