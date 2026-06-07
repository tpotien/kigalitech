import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') return res.status(403).end();

  const { rows } = req.body; // array of objects parsed from CSV on frontend
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: 'No rows provided' });

  const results = [];
  for (const row of rows) {
    try {
      const product = await prisma.product.create({
        data: {
          name: String(row.name || '').trim(),
          category: String(row.category || 'Phones').trim(),
          description: String(row.description || '').trim(),
          brand: String(row.brand || '').trim() || null,
          price: Math.round(parseFloat(row.price || 0) * 100),
          comparePrice: row.comparePrice ? Math.round(parseFloat(row.comparePrice) * 100) : null,
          stock: parseInt(row.stock || 0),
          sku: String(row.sku || '').trim() || null,
          active: String(row.active || 'true').toLowerCase() !== 'false',
          featured: String(row.featured || 'false').toLowerCase() === 'true',
        }
      });
      results.push({ ok: true, id: product.id, name: product.name });
    } catch (e) {
      results.push({ ok: false, name: row.name, error: e.message });
    }
  }
  return res.json({ imported: results.filter(r => r.ok).length, errors: results.filter(r => !r.ok).length, results });
}
