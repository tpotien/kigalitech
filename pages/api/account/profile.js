import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import { whatsappWelcome } from '../../../lib/whatsapp';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { name, imageDataUrl, phoneNumber } = req.body;
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (phoneNumber !== undefined) data.phoneNumber = phoneNumber.trim() || null;

  if (imageDataUrl) {
    if (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(imageDataUrl)) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    data.image = imageDataUrl;
  }

  // Check if this is the first time a phone is being added (to send welcome WA)
  let previousPhone = null;
  if (phoneNumber !== undefined) {
    const existing = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      select: { phoneNumber: true, name: true },
    });
    previousPhone = existing?.phoneNumber;
  }

  const user = await prisma.user.update({
    where: { id: Number(token.id) },
    data,
    select: { id: true, name: true, email: true, image: true, phoneNumber: true },
  });

  // Send WhatsApp welcome when phone number is added for the first time
  if (!previousPhone && user.phoneNumber) {
    whatsappWelcome(user.phoneNumber, user.name || token.name || 'Customer').catch(() => {});
  }

  return res.json(user);
}
