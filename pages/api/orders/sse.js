import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { orderId } = req.query;
  if (!orderId) return res.status(400).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const poll = async () => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        select: { id: true, status: true, adminConfirmed: true, paymentConfirmed: true, billPrintable: true, total: true, createdAt: true },
      });
      if (order) send(order);
    } catch {}
  };

  await poll();
  const interval = setInterval(poll, 4000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}

export const config = { api: { bodyParser: false } };
