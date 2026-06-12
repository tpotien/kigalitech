import prisma from '../../../lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kigalitechservices@gmail.com';
const FROM = process.env.EMAIL_FROM || 'KigaliTech <kigalitechservices@gmail.com>';
const BASE_URL = process.env.NEXTAUTH_URL || 'https://kigalitechservices.com';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const [products, outOfStock] = await Promise.all([
    prisma.product.findMany({
      where: { stock: { gt: 0 }, active: true },
      select: { id: true, name: true, stock: true, lowStockThreshold: true, category: true },
    }),
    prisma.product.findMany({
      where: { stock: 0, active: true },
      select: { id: true, name: true, category: true },
      take: 20,
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const alerts = products.filter(p => p.stock <= (p.lowStockThreshold ?? 5)).sort((a, b) => a.stock - b.stock);

  if (alerts.length === 0 && outOfStock.length === 0) {
    return res.json({ ok: true, message: 'No stock issues.' });
  }

  const makeRow = (p, extra) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${p.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;">${p.category || '—'}</td>
      ${extra}
      <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">
        <a href="${BASE_URL}/admin/products/${p.id}/edit" style="color:#0284c7;">Restock →</a>
      </td>
    </tr>`;

  const alertRows = alerts.map(p => makeRow(p,
    `<td style="padding:8px 12px;font-weight:700;color:${p.stock <= 2 ? '#dc2626' : '#d97706'};border-bottom:1px solid #f1f5f9;">${p.stock} left</td>
     <td style="padding:8px 12px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">(threshold: ${p.lowStockThreshold ?? 5})</td>`
  )).join('');

  const ooRows = outOfStock.map(p => makeRow(p,
    `<td colspan="2" style="padding:8px 12px;font-weight:700;color:#dc2626;border-bottom:1px solid #f1f5f9;">Out of stock</td>`
  )).join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#0f172a;">
      <h2 style="margin:0 0 4px;">⚠️ Stock Alert — KigaliTech</h2>
      <p style="color:#64748b;margin:0 0 24px;">${new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>

      ${alerts.length > 0 ? `
      <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin:0 0 8px;">Low Stock (${alerts.length})</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <thead><tr style="background:#f8fafc;text-align:left;font-size:12px;color:#94a3b8;">
          <th style="padding:8px 12px;">Product</th><th style="padding:8px 12px;">Category</th>
          <th style="padding:8px 12px;">Stock</th><th style="padding:8px 12px;">Threshold</th><th style="padding:8px 12px;"></th>
        </tr></thead>
        <tbody>${alertRows}</tbody>
      </table>` : ''}

      ${outOfStock.length > 0 ? `
      <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:.05em;color:#dc2626;margin:0 0 8px;">Out of Stock (${outOfStock.length})</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <thead><tr style="background:#f8fafc;text-align:left;font-size:12px;color:#94a3b8;">
          <th style="padding:8px 12px;">Product</th><th style="padding:8px 12px;">Category</th>
          <th colspan="2" style="padding:8px 12px;">Status</th><th style="padding:8px 12px;"></th>
        </tr></thead>
        <tbody>${ooRows}</tbody>
      </table>` : ''}

      <p style="text-align:center;margin-top:32px;">
        <a href="${BASE_URL}/admin/products"
          style="background:#0284c7;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
          Manage Inventory
        </a>
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `⚠️ ${alerts.length} low-stock + ${outOfStock.length} out-of-stock — KigaliTech`,
      html,
    });
  } catch (err) {
    console.error('[cron/low-stock-alert] Email failed:', err.message);
    return res.status(500).json({ error: 'Email send failed' });
  }

  res.json({ ok: true, alerts: alerts.length, outOfStock: outOfStock.length });
}
