import prisma from '../../../lib/prisma';
import { rateLimit } from '../../../lib/rate-limit';

const VALID_REASONS = ['scam', 'counterfeit', 'inappropriate', 'overpriced', 'already_sold'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  const { limited } = rateLimit(ip, 'marketplace-report', 5, 60 * 60 * 1000);
  if (limited) return res.status(429).json({ error: 'Too many reports. Please try again later.' });

  const { listingId, reason } = req.body;
  if (!listingId || !reason) return res.status(400).json({ error: 'listingId and reason required' });
  if (!VALID_REASONS.includes(reason)) return res.status(400).json({ error: 'Invalid reason' });

  const listing = await prisma.marketplaceListing.findFirst({
    where: { id: Number(listingId) },
    select: { id: true, adminNotes: true },
  });
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  const reportEntry = `[REPORT ${new Date().toISOString()} | ${reason} | IP:${ip}]`;
  const updatedNotes = listing.adminNotes
    ? `${listing.adminNotes}\n${reportEntry}`
    : reportEntry;

  await prisma.marketplaceListing.update({
    where: { id: Number(listingId) },
    data: { adminNotes: updatedNotes },
  });

  return res.json({ ok: true });
}
