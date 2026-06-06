import prisma from '../../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

const REQUIRED_COLS = ['name', 'price', 'category'];

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur.trim());
  return result;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
  return { headers, rows };
}

function rowToProduct(row) {
  const price = Math.round(parseFloat(row.price || '0') * 100);
  const comparePrice = row.compareprice ? Math.round(parseFloat(row.compareprice) * 100) : null;
  const stock = parseInt(row.stock || '0', 10);
  const lowStockThreshold = parseInt(row.lowstockthreshold || '5', 10);
  const featured = ['true', '1', 'yes'].includes((row.featured || '').toLowerCase());

  const parseJsonField = (val) => {
    if (!val) return '[]';
    try { JSON.parse(val); return val; } catch { /* not JSON */}
    return JSON.stringify(val.split('|').map(s => s.trim()).filter(Boolean));
  };

  return {
    name: row.name?.trim(),
    description: row.description?.trim() || '',
    brand: row.brand?.trim() || '',
    category: row.category?.trim(),
    price,
    comparePrice,
    stock,
    lowStockThreshold,
    featured,
    active: true,
    images: parseJsonField(row.images),
    colors: parseJsonField(row.colors),
    storageOptions: parseJsonField(row.storageoptions || row.storage),
    warrantyOptions: parseJsonField(row.warrantyoptions || row.warranty),
    specs: row.specs ? ((() => { try { return row.specs; } catch { return '{}'; } })()) : '{}',
    tags: parseJsonField(row.tags),
    bundledWith: parseJsonField(row.bundledwith),
    weight: row.weight ? parseFloat(row.weight) : null,
    serialNumbers: '[]',
  };
}

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'POST') {
    const { csv, preview } = req.body;
    if (!csv) return res.status(400).json({ error: 'No CSV data' });

    const { headers, rows } = parseCsv(csv);
    const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
    if (missing.length) return res.status(400).json({ error: `Missing required columns: ${missing.join(', ')}` });

    const products = rows.filter(r => r.name && r.category && r.price).map(rowToProduct);
    if (!products.length) return res.status(400).json({ error: 'No valid rows found' });

    if (preview) return res.json({ count: products.length, products: products.slice(0, 5) });

    const created = await prisma.$transaction(
      products.map(p => prisma.product.create({ data: p }))
    );

    return res.json({ success: true, count: created.length });
  }

  res.status(405).end();
}
