import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { productId, discountPct, hoursLeft } = req.body;
    if (!productId || !discountPct || !hoursLeft) {
      return res.status(400).json({ error: 'productId, discountPct, and hoursLeft are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const flashSalePrice = Math.round(product.price * (1 - Number(discountPct) / 100));
    const flashSaleEnd = new Date(Date.now() + Number(hoursLeft) * 60 * 60 * 1000);

    const updated = await prisma.product.update({
      where: { id: Number(productId) },
      data: { flashSalePrice, flashSaleEnd },
    });

    return res.json({ ok: true, product: updated });
  }

  if (req.method === 'DELETE') {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const updated = await prisma.product.update({
      where: { id: Number(productId) },
      data: { flashSalePrice: null, flashSaleEnd: null },
    });

    return res.json({ ok: true, product: updated });
  }

  res.setHeader('Allow', ['POST', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
