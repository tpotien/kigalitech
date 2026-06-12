import prisma from '../../../lib/prisma';
import { sendEmail } from '../../../lib/email';

const EXPIRY_DAYS = 60;

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - EXPIRY_DAYS);

  const expired = await prisma.marketplaceListing.findMany({
    where: { status: 'approved', createdAt: { lt: cutoff } },
    include: { seller: { select: { name: true, email: true } } },
  });

  if (!expired.length) return res.json({ expired: 0 });

  await prisma.marketplaceListing.updateMany({
    where: { id: { in: expired.map(l => l.id) } },
    data: { status: 'expired' },
  });

  // Notify sellers
  await Promise.allSettled(expired.map(listing => {
    if (!listing.seller?.email) return;
    return sendEmail({
      to: listing.seller.email,
      subject: 'Your KigaliTech listing has expired',
      html: `
        <p>Hi ${listing.seller.name || 'Seller'},</p>
        <p>Your listing <strong>${listing.title}</strong> has expired after ${EXPIRY_DAYS} days and is no longer visible in the marketplace.</p>
        <p>To relist it, go to <a href="https://kigalitechservices.com/marketplace/my-listings">My Listings</a> and resubmit.</p>
        <p>— KigaliTech Team</p>
      `,
    });
  }));

  return res.json({ expired: expired.length });
}
