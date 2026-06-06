import prisma from '../../../lib/prisma';
import { notifyRepairUpdate } from '../../../lib/notify';

const REPAIR_STATUS_MESSAGES = {
  open: 'Your repair ticket has been opened and is awaiting review.',
  in_progress: 'Great news! Your device is currently being repaired by our technician.',
  waiting_parts: 'We are waiting for parts to arrive before continuing your repair.',
  completed: 'Your repair is complete! Your device is ready for pickup or delivery. 🎉',
  cancelled: 'Your repair ticket has been cancelled. Please contact us if you have questions.',
};

async function sendWhatsAppRepairUpdate({ phone, customerName, ticket, status }) {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!waNumber || !phone) return;

  const msg = REPAIR_STATUS_MESSAGES[status] || `Your repair ticket #${ticket.id} status has been updated to: ${status}.`;
  const text = encodeURIComponent(
    `Hi ${customerName || 'there'} 👋\n\n*KigaliTech Repair Update*\n\nTicket #${ticket.id}: *${ticket.deviceType || 'Device'}*\nStatus: *${status.replace('_', ' ').toUpperCase()}*\n\n${msg}\n\nReply to this message or visit our store for more info.`
  );

  // Using WhatsApp Business API (if WHATSAPP_API_TOKEN is set), otherwise log
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (apiToken && phoneNumberId) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: decodeURIComponent(text) },
      }),
    }).catch(() => {});
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const tickets = await prisma.repairTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, phone: true } }, order: { select: { id: true, status: true } } },
    });
    return res.json(tickets);
  }

  if (req.method === 'PATCH') {
    const ticketId = req.query.id || req.body.id;
    const { status, adminNotes, priority } = req.body;

    const ticket = await prisma.repairTicket.update({
      where: { id: Number(ticketId) },
      data: { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }), ...(priority && { priority }), updatedAt: new Date() },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });

    if (status) {
      // In-app notification (non-blocking)
      notifyRepairUpdate({ ticket, status }).catch(() => {});
      // WhatsApp notification (non-blocking)
      const phone = ticket.user?.phone || ticket.contactPhone;
      if (phone) {
        sendWhatsAppRepairUpdate({ phone, customerName: ticket.user?.name || ticket.contactName, ticket, status }).catch(() => {});
      }
    }

    return res.json(ticket);
  }

  res.status(405).end();
}
