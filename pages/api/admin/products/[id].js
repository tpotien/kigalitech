import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';

export const config = { api: { bodyParser: { sizeLimit: '15mb' } } };
import { sendLowStockAlert, sendBackInStockEmail, sendPriceDropEmail } from '../../../../lib/email';

function serialize(p) {
  const result = { ...p };
  const jsonFields = ['images', 'colors', 'storageOptions', 'warrantyOptions', 'specs', 'serialNumbers', 'tags', 'colorImages'];
  for (const f of jsonFields) {
    if (f in result && typeof result[f] !== 'string') {
      result[f] = JSON.stringify(result[f]);
    }
  }
  return result;
}

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.query.id);

  if (req.method === 'GET') {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.json(product);
  }

  if (req.method === 'PUT') {
    // Capture previous state before update
    const previous = await prisma.product.findUnique({ where: { id }, select: { stock: true, price: true } });

    const data = serialize(req.body);
    delete data.id;
    const product = await prisma.product.update({ where: { id }, data });

    // Back-in-stock: was 0, now >0 → notify subscribers asynchronously
    if (previous && previous.stock === 0 && product.stock > 0) {
      (async () => {
        const alerts = await prisma.stockAlert.findMany({
          where: { productId: id, notified: false },
        });
        if (alerts.length === 0) return;
        await prisma.stockAlert.updateMany({ where: { productId: id, notified: false }, data: { notified: true } });
        for (const alert of alerts) {
          const email = alert.email || (alert.userId
            ? await prisma.user.findUnique({ where: { id: alert.userId }, select: { email: true } }).then(u => u?.email)
            : null);
          if (email) sendBackInStockEmail({ email, productName: product.name, productId: id }).catch(() => {});
        }
      })().catch(() => {});
    }

    // Price drop: price decreased → notify price-alert subscribers asynchronously
    if (previous && typeof data.price === 'number' && product.price < previous.price) {
      (async () => {
        const alerts = await prisma.priceAlert.findMany({
          where: { productId: id, notified: false },
        });
        if (alerts.length === 0) return;
        await prisma.priceAlert.updateMany({ where: { productId: id, notified: false }, data: { notified: true } });
        for (const alert of alerts) {
          const email = alert.email || (alert.userId
            ? await prisma.user.findUnique({ where: { id: alert.userId }, select: { email: true } }).then(u => u?.email)
            : null);
          if (email) sendPriceDropEmail({ email, productName: product.name, productId: id, oldPrice: previous.price, newPrice: product.price }).catch(() => {});
        }
      })().catch(() => {});
    }

    // Low-stock admin alert
    const threshold = product.lowStockThreshold ?? 5;
    if (product.stock > 0 && product.stock <= threshold) {
      sendLowStockAlert({ product }).catch(() => {});
    }

    // Revalidate ISR pages immediately so changes are live
    try {
      await res.revalidate(`/products/${id}`);
      await res.revalidate('/products');
      await res.revalidate('/deals');
      await res.revalidate('/');
    } catch {}

    return res.json(product);
  }

  if (req.method === 'POST' && req.query.action === 'duplicate') {
    const original = await prisma.product.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ error: 'Not found' });
    const { id: _id, createdAt, updatedAt, sku, ...rest } = original;
    const duplicate = await prisma.product.create({
      data: {
        ...rest,
        name: `${original.name} (Copy)`,
        sku: sku ? `${sku}-copy-${Date.now()}` : undefined,
        active: false,
        stock: 0,
      },
    });
    return res.status(201).json(duplicate);
  }

  if (req.method === 'DELETE') {
    const { hard } = req.body || {};
    if (hard) {
      await prisma.product.delete({ where: { id } });
    } else {
      await prisma.product.update({ where: { id }, data: { active: false } });
    }
    return res.json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end();
}
