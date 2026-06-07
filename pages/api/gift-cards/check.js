import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code is required' });
  const card = await prisma.giftCard.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!card) return res.status(404).json({ error: 'Gift card not found. Check the code and try again.' });
  return res.json({ balance: card.balance, amount: card.amount, expiresAt: card.expiresAt, redeemed: card.balance === 0 });
}
