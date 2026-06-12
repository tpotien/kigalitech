import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import { broadcastNewProduct } from '../../../lib/email';

export const config = { api: { bodyParser: { sizeLimit: '15mb' } } };

function serialize(p) {
  return {
    ...p,
    images: JSON.stringify(p.images),
    colors: JSON.stringify(p.colors),
    storageOptions: JSON.stringify(p.storageOptions),
    warrantyOptions: JSON.stringify(p.warrantyOptions),
    specs: JSON.stringify(p.specs),
    serialNumbers: JSON.stringify(p.serialNumbers),
    tags: JSON.stringify(p.tags || []),
    colorImages: typeof p.colorImages === 'string' ? p.colorImages : JSON.stringify(p.colorImages || {}),
  };
}

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method === 'GET') {
    const { search } = req.query;
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }] }
      : undefined;
    const products = await prisma.product.findMany({ where, orderBy: { id: 'desc' }, ...(search ? { take: 20 } : {}) });

    // Strip large base64 images from the list payload — keep only the first CDN URL for the thumbnail.
    // Individual product edits still fetch full data via GET /api/admin/products/[id].
    const trimmed = products.map(p => {
      let firstImg = '';
      try {
        const imgs = JSON.parse(p.images || '[]');
        firstImg = imgs.find(img => img && img.length > 5 && !img.startsWith('data:')) || '';
      } catch {}
      return { ...p, images: JSON.stringify(firstImg ? [firstImg] : []) };
    });

    return res.json(trimmed);
  }

  if (req.method === 'POST' && req.query.action === 'activate_all') {
    const result = await prisma.product.updateMany({ where: { active: false }, data: { active: true } });
    return res.json({ activated: result.count });
  }

  if (req.method === 'POST') {
    const data = serialize(req.body);
    const product = await prisma.product.create({ data });

    // Fire newsletter broadcast in background — don't block the response
    if (product.active) {
      prisma.newsletter.findMany({ where: { active: true }, select: { email: true, name: true } })
        .then(subscribers => broadcastNewProduct({ product: req.body, subscribers }))
        .catch(err => console.error('[products] newsletter broadcast error:', err.message));
    }

    try {
      await res.revalidate(`/products/${product.id}`);
      await res.revalidate('/products');
      await res.revalidate('/deals');
      await res.revalidate('/');
    } catch {}

    return res.status(201).json(product);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
