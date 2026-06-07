import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end();

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { name, imageDataUrl } = req.body;
  const data = {};
  if (name !== undefined) data.name = name.trim();

  if (imageDataUrl) {
    if (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(imageDataUrl)) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    // Store directly in DB — Vercel filesystem is ephemeral
    data.image = imageDataUrl;
  }

  const user = await prisma.user.update({
    where: { id: Number(token.id) },
    data,
    select: { id: true, name: true, email: true, image: true },
  });
  return res.json(user);
}
