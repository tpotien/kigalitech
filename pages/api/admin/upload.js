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

  try {
    // Decode base64 to binary
    const matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ error: 'Invalid image format' });
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/product-images/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': mimeType,
          'x-upsert': 'true',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error('[upload] Supabase error:', err);
      // Fallback: return data URI if Supabase fails
      return res.json({ url: imageDataUrl });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${filename}`;
    return res.json({ url: publicUrl });

  } catch (err) {
    console.error('[upload] error:', err.message);
    // Fallback to data URI on any error
    return res.json({ url: imageDataUrl });
  }
}
