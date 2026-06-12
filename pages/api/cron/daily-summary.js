import prisma from '../../../lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kigalitechservices@gmail.com';
const RWF = (n) => `RWF ${Math.round(n).toLocaleString()}`;

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);
  const yesterday = new Date(dayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  const [todayOrders, yesterdayOrders, lowStock, pendingOrders] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: yesterday, lt: dayStart } },
      include: { items: true },
    }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: 5 } },
      orderBy: { stock: 'asc' },
      take: 10,
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
    }),
    prisma.order.count({ where: { status: 'pending' } }),
  ]);

  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0);
  const revenueChange = yesterdayRevenue > 0
    ? (((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(1)
    : null;

  const todayDelivered = todayOrders.filter(o => o.status === 'delivered').length;
  const todayCancelled = todayOrders.filter(o => o.status === 'cancelled').length;

  const lowStockRows = lowStock.length
    ? lowStock.map(p => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${p.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:700;color:${p.stock <= 2 ? '#dc2626' : '#d97706'};">${p.stock}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#64748b;">${p.lowStockThreshold || 5}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" style="padding:12px;text-align:center;color:#64748b;">All products well stocked</td></tr>';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">

  <!-- Header -->
  <div style="background:#0f172a;padding:24px 28px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <p style="color:#fff;font-size:20px;font-weight:800;margin:0;">KigaliTech</p>
      <p style="color:#7dd3fc;font-size:12px;margin:4px 0 0;">Daily Sales Summary</p>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:0;">${now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
  </div>

  <!-- Stats grid -->
  <div style="padding:24px 28px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    ${[
      { label: "Today's Revenue", value: RWF(todayRevenue), sub: revenueChange ? `${revenueChange > 0 ? '↑' : '↓'} ${Math.abs(revenueChange)}% vs yesterday` : 'First day', color: todayRevenue >= yesterdayRevenue ? '#16a34a' : '#dc2626' },
      { label: "Orders Today", value: todayOrders.length, sub: `${yesterdayOrders.length} yesterday`, color: '#0ea5e9' },
      { label: "Pending Orders", value: pendingOrders, sub: 'awaiting confirmation', color: '#d97706' },
      { label: "Delivered Today", value: todayDelivered, sub: `${todayCancelled} cancelled`, color: '#7c3aed' },
    ].map(s => `
      <div style="background:#f8fafc;border-radius:12px;padding:16px;">
        <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px;">${s.label}</p>
        <p style="font-size:22px;font-weight:800;color:${s.color};margin:0;">${s.value}</p>
        <p style="font-size:11px;color:#64748b;margin:4px 0 0;">${s.sub}</p>
      </div>`).join('')}
  </div>

  <!-- Low stock -->
  <div style="padding:0 28px 24px;">
    <p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 12px;">⚠️ Low Stock Alert</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;font-size:13px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Product</th>
          <th style="padding:8px 12px;text-align:center;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Stock</th>
          <th style="padding:8px 12px;text-align:center;color:#94a3b8;font-size:11px;text-transform:uppercase;font-weight:600;">Threshold</th>
        </tr>
      </thead>
      <tbody>${lowStockRows}</tbody>
    </table>
  </div>

  <!-- CTA -->
  <div style="padding:0 28px 28px;text-align:center;">
    <a href="https://kigalitechservices.com/admin/orders" style="display:inline-block;background:#0ea5e9;color:#fff;font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none;font-size:13px;">View Admin Dashboard →</a>
  </div>

  <div style="background:#f8fafc;padding:16px 28px;text-align:center;font-size:11px;color:#94a3b8;">
    This is an automated daily summary from KigaliTech.
  </div>
</div>
</body>
</html>`;

  await resend.emails.send({
    from: 'KigaliTech Reports <hello@kigalitechservices.com>',
    to: ADMIN_EMAIL,
    subject: `📊 Daily Summary — ${RWF(todayRevenue)} revenue · ${todayOrders.length} orders (${now.toLocaleDateString('en-US', { month:'short', day:'numeric' })})`,
    html,
  });

  return res.json({ ok: true, orders: todayOrders.length, revenue: todayRevenue });
}
