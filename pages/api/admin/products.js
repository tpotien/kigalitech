import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';

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
    const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
    return res.json(products);
  }

  if (req.method === 'POST') {
    const data = serialize(req.body);
    const product = await prisma.product.create({ data });
    return res.status(201).json(product);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end();
}
