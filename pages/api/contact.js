import { sendContactFormEmail } from '../../lib/email';
import { rateLimit } from '../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'contact', 3, 300_000)) return res.status(429).json({ error: 'Too many submissions. Please wait.' });

  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields are required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return res.status(400).json({ error: 'Valid email required' });

  try {
    await sendContactFormEmail({ name, email, subject, message });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[contact]', e.message);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
