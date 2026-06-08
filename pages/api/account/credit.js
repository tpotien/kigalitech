import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  const userId = Number(token.id);

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storeCredit: true },
    });
    return res.json({ storeCredit: user?.storeCredit || 0 });
  }

  res.status(405).end();
}
