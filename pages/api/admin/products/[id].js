import prisma from '../../../../lib/prisma';

function serialize(p) {
  const result = { ...p };
  const jsonFields = ['images', 'colors', 'storageOptions', 'warrantyOptions', 'specs', 'serialNumbers', 'tags'];
  for (const f of jsonFields) {
    if (f in result && typeof result[f] !== 'string') {
      result[f] = JSON.stringify(result[f]);
    }
  }
  return result;
}

export default async function handler(req, res) {
  const id = Number(req.query.id);

  if (req.method === 'GET') {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Not found' });
    return res.json(product);
  }

  if (req.method === 'PUT') {
    const data = serialize(req.body);
    delete data.id;
    const product = await prisma.product.update({ where: { id }, data });
    return res.json(product);
  }

  if (req.method === 'DELETE') {
    await prisma.product.update({ where: { id }, data: { active: false } });
    return res.json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  res.status(405).end();
}
