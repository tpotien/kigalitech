import prisma from '../../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const token = await getToken({ req });
  if (!token) return res.status(401).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let lastId = 0;

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  };

  send({ type: 'ping' });

  const interval = setInterval(async () => {
    try {
      const where = { userId: Number(token.id), id: { gt: lastId } };
      const notifs = await prisma.notification.findMany({ where, orderBy: { id: 'asc' } });
      for (const n of notifs) { send(n); lastId = n.id; }
      send({ type: 'ping' });
    } catch { clearInterval(interval); }
  }, 5000);

  req.on('close', () => clearInterval(interval));
}
