import prisma from '../../../lib/prisma';

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
  };
}

export default async function handler(req, res) {
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
