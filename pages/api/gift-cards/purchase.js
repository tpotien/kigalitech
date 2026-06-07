import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { amount, buyerEmail, buyerName, toEmail, toName, message } = req.body;
  if (!amount || !buyerEmail || !buyerName) return res.status(400).json({ error: 'Amount, your name and email are required' });
  const amt = Number(amount);
  if (isNaN(amt) || amt < 100000 || amt > 500000000) {
    return res.status(400).json({ error: 'Amount must be between RWF 1,000 and RWF 5,000,000' });
  }
  const code = 'KT-' + Math.random().toString(36).slice(2,6).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const card = await prisma.giftCard.create({
    data: { code, amount: amt, balance: amt, buyerEmail, buyerName: buyerName || '', toEmail: toEmail || null, toName: toName || '', message: message || '', expiresAt }
  });
  return res.status(201).json(card);
}
