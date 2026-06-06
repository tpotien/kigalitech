import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const tickets = await prisma.repairTicket.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, order: { select: { id: true, status: true } } },
    });
    return res.json(tickets);
  }
  if (req.method === 'PATCH') {
    const ticketId = req.query.id || req.body.id;
    const { status, adminNotes, priority } = req.body;
    const ticket = await prisma.repairTicket.update({
      where: { id: Number(ticketId) },
      data: { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }), ...(priority && { priority }), updatedAt: new Date() },
    });
    return res.json(ticket);
  }
  res.status(405).end();
}
