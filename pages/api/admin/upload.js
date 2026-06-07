import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { imageDataUrl } = req.body;
  if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Valid image required' });
  }

  // Store as data URL — persists in DB, works on Vercel (no filesystem write)
  return res.json({ url: imageDataUrl });
}
