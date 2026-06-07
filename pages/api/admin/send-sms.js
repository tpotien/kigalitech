import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import { sendSms } from '../../../lib/sms';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { phone, message, orderId } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone and message are required' });
  }

  const result = await sendSms(phone, message);

  // Log the attempt regardless of outcome
  try {
    await prisma.smsLog.create({
      data: {
        to: phone,
        message,
        status: result.sent ? 'sent' : 'failed',
        provider: 'africastalking',
        orderId: orderId ? Number(orderId) : null,
      },
    });
  } catch (logErr) {
    console.error('[send-sms] Failed to write SmsLog:', logErr.message);
  }

  if (!result.sent) {
    return res.status(500).json({ sent: false, error: result.error });
  }

  return res.status(200).json({ sent: true, messageId: result.messageId });
}
