import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import { sendSms } from '../../../lib/sms';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || token.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const { audience = 'all' } = req.query;
    let users = [];
    if (audience === 'all') {
      users = await prisma.user.findMany({ where: { phoneNumber: { not: null } }, select: { id: true, name: true, phoneNumber: true } });
    } else if (audience === 'buyers') {
      const ordered = await prisma.order.findMany({ where: { userId: { not: null }, shippingPhone: { not: null } }, select: { userId: true, shippingPhone: true, shippingName: true }, distinct: ['userId'] });
      users = ordered.map(o => ({ id: o.userId, name: o.shippingName, phoneNumber: o.shippingPhone }));
    } else if (audience === 'loyalty') {
      users = await prisma.user.findMany({ where: { phoneNumber: { not: null }, loyaltyPoints: { gt: 0 } }, select: { id: true, name: true, phoneNumber: true } });
    }
    return res.json({ count: users.length });
  }

  if (req.method === 'POST') {
    const { message, audience = 'all' } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    let phones = [];
    if (audience === 'all') {
      const users = await prisma.user.findMany({ where: { phoneNumber: { not: null } }, select: { phoneNumber: true } });
      phones = users.map(u => u.phoneNumber);
    } else if (audience === 'buyers') {
      const orders = await prisma.order.findMany({ where: { shippingPhone: { not: null } }, select: { shippingPhone: true }, distinct: ['shippingPhone'] });
      phones = orders.map(o => o.shippingPhone);
    } else if (audience === 'loyalty') {
      const users = await prisma.user.findMany({ where: { phoneNumber: { not: null }, loyaltyPoints: { gt: 0 } }, select: { phoneNumber: true } });
      phones = users.map(u => u.phoneNumber);
    }

    phones = [...new Set(phones.filter(Boolean))];
    let sent = 0, failed = 0;
    for (const phone of phones) {
      const result = await sendSms(phone, message);
      if (result.sent) sent++; else failed++;
    }
    return res.json({ sent, failed, total: phones.length });
  }

  res.status(405).end();
}
