import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const id = parseInt(req.query.id);
  const userId = Number(token.id);

  const tradeIn = await prisma.tradeIn.findFirst({ where: { id, userId } });
  if (!tradeIn) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'PATCH') {
    const { action, counterPrice, userNotes } = req.body;

    if (action === 'accept') {
      if (tradeIn.status !== 'offer_made') return res.status(400).json({ error: 'No offer to accept' });
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: { status: 'accepted', finalPrice: tradeIn.offeredPrice, updatedAt: new Date() },
      });
      return res.json(updated);
    }

    if (action === 'reject') {
      if (!['offer_made', 'pending'].includes(tradeIn.status)) return res.status(400).json({ error: 'Cannot reject at this stage' });
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: { status: 'rejected', updatedAt: new Date() },
      });
      return res.json(updated);
    }

    if (action === 'counter') {
      if (tradeIn.status !== 'offer_made') return res.status(400).json({ error: 'No offer to counter' });
      const amt = parseInt(counterPrice);
      if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid counter amount' });
      const updated = await prisma.tradeIn.update({
        where: { id },
        data: {
          status: 'negotiating',
          counterPrice: amt,
          userNotes: userNotes || '',
          updatedAt: new Date(),
        },
      });
      // Notify admin (create admin notification — target all admin users)
      const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
      await Promise.all(admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'trade_in',
            title: 'Counter-offer received',
            body: `${token.name || token.email} countered your offer with RWF ${Math.round(amt).toLocaleString()} for ${tradeIn.productName}`,
            link: `/admin/trade-ins/${id}`,
          },
        })
      ));
      return res.json(updated);
    }

    return res.status(400).json({ error: 'Unknown action' });
  }

  return res.status(405).end();
}
