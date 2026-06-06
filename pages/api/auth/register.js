import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, password } = req.body;
  if ((!email && !phone) || !password || !name) {
    return res.status(400).json({ error: 'Name, password, and email or phone are required' });
  }

  const identifier = email || `${phone.replace(/\D/g, '')}@phone.kigalitech.com`;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, ...(phone ? [{ phoneNumber: phone }] : [])] },
  });
  if (existing) return res.status(400).json({ error: 'Account already exists with this email or phone' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: identifier,
      password: hashed,
      phoneNumber: phone || null,
      role: 'user',
    },
  });

  return res.status(201).json({ id: user.id, name: user.name, email: user.email });
}
