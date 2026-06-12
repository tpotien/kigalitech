import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

async function sendSellerNotification(listing, newStatus, sellerEmail, sellerName) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY || !sellerEmail) return;

  const SITE = process.env.NEXTAUTH_URL || 'https://kigalitechservices.com';

  const configs = {
    approved: {
      subject: `✅ Your listing "${listing.title}" is now live!`,
      heading: 'Listing Approved!',
      color: '#10b981',
      body: `Your listing <strong>${listing.title}</strong> has been reviewed and approved by KigaliTech. It is now live in the marketplace for buyers to see.`,
      cta: { label: 'View Your Listing', url: `${SITE}/marketplace` },
    },
    rejected: {
      subject: `Your listing "${listing.title}" needs attention`,
      heading: 'Listing Not Approved',
      color: '#ef4444',
      body: `Unfortunately, your listing <strong>${listing.title}</strong> could not be approved at this time.${listing.adminNotes ? `<br/><br/><strong>Reason:</strong> ${listing.adminNotes}` : ''}<br/><br/>You can update your listing and resubmit.`,
      cta: { label: 'Update Listing', url: `${SITE}/marketplace/sell` },
    },
    verified: {
      subject: `🏆 Your listing "${listing.title}" is verified!`,
      heading: 'Listing Verified ✓',
      color: '#0ea5e9',
      body: `Great news! Your listing <strong>${listing.title}</strong> has been <strong>verified</strong> by KigaliTech. A verified badge will now appear on your listing, building trust with buyers.`,
      cta: { label: 'View in Marketplace', url: `${SITE}/marketplace` },
    },
  };

  const cfg = configs[newStatus];
  if (!cfg) return;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:16px">
      <div style="background:${cfg.color};border-radius:12px;padding:24px 28px;margin-bottom:20px;text-align:center">
        <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff">${cfg.heading}</h1>
      </div>
      <div style="background:#fff;border-radius:12px;padding:24px 28px;margin-bottom:16px;border:1px solid #e2e8f0">
        <p style="margin:0 0 12px;font-size:16px;color:#0f172a">Hi ${sellerName || 'there'} 👋</p>
        <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6">${cfg.body}</p>
        <a href="${cfg.cta.url}" style="display:inline-block;background:${cfg.color};color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:99px;text-decoration:none">${cfg.cta.label}</a>
      </div>
      <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center">KigaliTech Marketplace · +250 786 276 555</p>
    </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'KigaliTech <noreply@kigalitechservices.com>',
      to: sellerEmail,
      subject: cfg.subject,
      html,
    }),
  }).catch(err => console.error('[marketplace] notify email failed:', err.message));
}

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const { status } = req.query;
    const listings = await prisma.marketplaceListing.findMany({
      where: status && status !== 'all' ? { status } : {},
      include: {
        seller: {
          select: { name: true, email: true, phoneNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(listings);
  }

  if (req.method === 'PATCH') {
    const id = req.query.id;
    const { status, adminNotes, verified } = req.body;

    // Fetch listing + seller before updating (for notification)
    const existing = await prisma.marketplaceListing.findUnique({
      where: { id: Number(id) },
      include: { seller: { select: { name: true, email: true } } },
    });

    const listing = await prisma.marketplaceListing.update({
      where: { id: Number(id) },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(verified !== undefined && { verified }),
        updatedAt: new Date(),
      },
      include: { seller: { select: { name: true, email: true } } },
    });

    // Notify seller if status changed
    if (status && existing?.status !== status) {
      sendSellerNotification(
        listing,
        verified ? 'verified' : status,
        listing.seller?.email,
        listing.seller?.name
      ).catch(() => {});
    }
    if (verified && !existing?.verified) {
      sendSellerNotification(listing, 'verified', listing.seller?.email, listing.seller?.name).catch(() => {});
    }

    return res.json(listing);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    await prisma.marketplaceListing.delete({ where: { id: Number(id) } });
    return res.json({ success: true });
  }

  res.status(405).end();
}
