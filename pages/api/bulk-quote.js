import prisma from '../../lib/prisma';
import { rateLimit } from '../../lib/rate-limit';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip, 'bulk-quote', 3, 60_000)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  const { companyName, contactName, email, phone, items, message } = req.body;
  if (!companyName || !contactName || !email || !phone) {
    return res.status(400).json({ error: 'Company name, contact, email and phone are required' });
  }
  try {
  const quote = await prisma.bulkQuote.create({
    data: { companyName, contactName, email, phone, items: items || '', message: message || '' }
  });
  return res.status(201).json(quote);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}
