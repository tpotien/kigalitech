import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token || token.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id: Number(token.id) },
      select: { id: true, name: true, email: true, image: true, role: true },
    });
    return res.json(user);
  }

  if (req.method === 'PATCH') {
    const { name, email, password, imageDataUrl } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);

    if (imageDataUrl) {
      const matches = imageDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
        const fileName = `${Date.now()}-admin.${ext}`;
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(path.join(uploadsDir, fileName), base64Data, 'base64');
        data.image = `/uploads/${fileName}`;
      }
    }

    const user = await prisma.user.update({
      where: { id: Number(token.id) },
      data,
      select: { id: true, name: true, email: true, image: true, role: true },
    });
    return res.json(user);
  }

  res.status(405).end();
}
