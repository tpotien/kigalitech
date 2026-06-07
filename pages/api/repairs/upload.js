import fs from 'fs';
import path from 'path';
import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in to upload images' });

  const { imageDataUrl } = req.body;
  if (!imageDataUrl) return res.status(400).json({ error: 'No image data provided' });

  const matches = imageDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'Invalid image format' });

  const ext = matches[1] === 'image/png' ? 'png' : matches[1] === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `repair-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, fileName), matches[2], 'base64');
  return res.json({ url: `/uploads/${fileName}` });
}
