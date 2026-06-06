import fs from 'fs';
import path from 'path';
import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { imageDataUrl } = req.body;
  if (!imageDataUrl) return res.status(400).json({ error: 'No image data' });

  const matches = imageDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'Invalid image data' });

  const mimeType = matches[1];
  const base64Data = matches[2];
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, fileName), base64Data, 'base64');

  return res.json({ url: `/uploads/${fileName}` });
}
