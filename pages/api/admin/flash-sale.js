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
    const hours = Number(hoursLeft);
    if (isNaN(hours) || hours <= 0 || hours > 720) {
      return res.status(400).json({ error: 'hoursLeft must be between 1 and 720' });
    }
    const pct = Number(discountPct);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      return res.status(400).json({ error: 'discountPct must be between 1 and 99' });
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const flashSalePrice = Math.round(product.price * (1 - pct / 100));
    const flashSaleEnd = new Date(Date.now() + hours * 60 * 60 * 1000);

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
