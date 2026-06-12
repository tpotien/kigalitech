import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import { createNotification, notifyRepairUpdate } from '../../../lib/notify';
import { sendRepairQuoteEmail, sendRepairStatusEmail } from '../../../lib/email';
import { whatsappRepairUpdate, sendWhatsAppText } from '../../../lib/whatsapp';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const tickets = await prisma.repairTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, phoneNumber: true } }, order: { select: { id: true, status: true } } },
    });
    return res.json(tickets);
  }

  if (req.method === 'PATCH') {
    const ticketId = req.query.id || req.body.id;
    const { status, adminNotes, priority, action, quotedCost, quoteNotes } = req.body;

    // Set repair cost quote
    if (action === 'set_quote') {
      if (!quotedCost || Number(quotedCost) <= 0) return res.status(400).json({ error: 'Invalid quote amount' });
      const ticket = await prisma.repairTicket.update({
        where: { id: Number(ticketId) },
        data: {
          quotedCost: Number(quotedCost),
          quoteNotes: quoteNotes || '',
          quoteStatus: 'quoted',
          status: 'open',
          updatedAt: new Date(),
        },
        include: { user: { select: { name: true, email: true, phoneNumber: true } } },
      });
      // Notify the customer
      await createNotification({
        userId: ticket.userId,
        type: 'repair_quote',
        title: `Repair Quote for #${ticket.id}`,
        body: `Your ${ticket.productName} repair quote is RWF ${Math.round(ticket.quotedCost).toLocaleString()}. Accept or decline in your account.`,
        link: `/account#repairs`,
      });
      const qEmail = ticket.user?.email;
      if (qEmail) sendRepairQuoteEmail({ ticket, customerEmail: qEmail, customerName: ticket.user?.name }).catch(() => {});
      // WhatsApp quote notification
      const qPhone = ticket.user?.phoneNumber;
      if (qPhone) {
        const qMsg = `Hello ${ticket.user?.name || 'Customer'}! 🔧\n\nYour KigaliTech repair quote for *${ticket.productName}* (#${ticket.id}) is ready.\n💰 Quote: *RWF ${Math.round(ticket.quotedCost).toLocaleString()}*\n\nAccept or decline in your account:\nhttps://kigalitechservices.com/account#repairs`;
        sendWhatsAppText(qPhone, qMsg).catch(() => {});
      }
      return res.json(ticket);
    }

    // Confirm repair after acceptance
    if (action === 'confirm') {
      const ticket = await prisma.repairTicket.update({
        where: { id: Number(ticketId) },
        data: { quoteStatus: 'confirmed', status: 'in_progress', updatedAt: new Date() },
      });
      await createNotification({
        userId: ticket.userId,
        type: 'repair_update',
        title: `Repair #${ticket.id} Confirmed`,
        body: `Your repair has been confirmed and is now in progress.`,
        link: `/account#repairs`,
      });
      return res.json(ticket);
    }

    // General update (status, notes, priority)
    const ticket = await prisma.repairTicket.update({
      where: { id: Number(ticketId) },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
        ...(priority && { priority }),
        updatedAt: new Date(),
      },
      include: { user: { select: { name: true, email: true, phoneNumber: true } } },
    });

    if (status) {
      notifyRepairUpdate({ ticket, status }).catch(() => {});
      const sEmail = ticket.user?.email;
      if (sEmail) sendRepairStatusEmail({ ticket, status, customerEmail: sEmail, customerName: ticket.user?.name }).catch(() => {});
      const sPhone = ticket.user?.phoneNumber;
      if (sPhone) whatsappRepairUpdate(sPhone, ticket.user?.name || 'Customer', ticket.id, status).catch(() => {});
    }

    return res.json(ticket);
  }

  res.status(405).end();
}
