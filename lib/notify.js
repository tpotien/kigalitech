import prisma from './prisma';

export async function createNotification({ userId, type, title, body, link = '' }) {
  try {
    return await prisma.notification.create({ data: { userId, type, title, body, link } });
  } catch {}
}

export async function notifyOrderUpdate({ order, status }) {
  if (order.userId) {
    await createNotification({
      userId: order.userId,
      type: 'order_update',
      title: `Order #${order.id} — ${capitalize(status)}`,
      body: statusMessages[status] || `Your order status changed to ${status}`,
      link: `/orders/${order.id}`,
    });
  }
  // Notify all admins and staff
  const staff = await prisma.user.findMany({ where: { role: { in: ['admin', 'staff'] } } });
  for (const s of staff) {
    await createNotification({
      userId: s.id,
      type: 'new_order',
      title: `Order #${order.id} updated`,
      body: `Status changed to ${status}`,
      link: `/admin/orders/${order.id}`,
    });
  }
}

export async function notifyNewOrder(order) {
  const staff = await prisma.user.findMany({ where: { role: { in: ['admin', 'staff'] } } });
  for (const s of staff) {
    await createNotification({
      userId: s.id,
      type: 'new_order',
      title: `New Order #${order.id}`,
      body: `$${(order.total / 100).toFixed(2)} — awaiting confirmation`,
      link: `/admin/orders/${order.id}`,
    });
  }
}

export async function notifyRepairUpdate({ ticket, status }) {
  await createNotification({
    userId: ticket.userId,
    type: 'repair_update',
    title: `Repair #${ticket.id} — ${capitalize(status.replace('_', ' '))}`,
    body: `Your repair ticket has been updated`,
    link: `/account#repairs`,
  });
}

const statusMessages = {
  confirmed: 'Your order has been confirmed!',
  processing: 'Your items are being prepared.',
  shipped: 'Your order is on the way!',
  delivered: 'Your order has been delivered.',
  cancelled: 'Your order has been cancelled.',
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
