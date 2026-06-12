import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const email = (req.query.email || req.body?.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'Email required' });

  await prisma.newsletter.updateMany({
    where: { email },
    data: { active: false },
  }).catch(() => {});

  // Support GET for one-click unsubscribe links in email clients
  if (req.method === 'GET') {
    return res.redirect(`/?unsubscribed=1`);
  }
  res.json({ success: true });
}
