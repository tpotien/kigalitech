import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { companyName, contactName, email, phone, items, message } = req.body;
  if (!companyName || !contactName || !email || !phone) {
    return res.status(400).json({ error: 'Company name, contact, email and phone are required' });
  }
  const quote = await prisma.bulkQuote.create({
    data: { companyName, contactName, email, phone, items: items || '', message: message || '' }
  });
  return res.status(201).json(quote);
}
