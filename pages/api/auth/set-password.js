import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Not signed in' });

  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: Number(token.id) },
    data: { password: hashed, mustChangePassword: false },
  });

  return res.json({ ok: true });
}
