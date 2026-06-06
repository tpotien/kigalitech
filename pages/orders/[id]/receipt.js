import prisma from '../../../lib/prisma';

export async function getServerSideProps({ params }) {
  const order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: { items: true, user: true }
  });
  if (!order) return { notFound: true };
  return { props: { order: JSON.parse(JSON.stringify(order)) } };
}

export default function Receipt({ order }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">Receipt</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Order #{order.id}</h1>
          </div>
          <div className="rounded-3xl bg-slate-100 px-5 py-3">
            <p className="text-sm text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">${(order.total / 100).toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Date</p>
            <p className="mt-2 text-slate-900">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Customer</p>
            <p className="mt-2 text-slate-900">{order.user?.email || 'Guest'}</p>
          </div>
        </div>
        <table className="mt-8 w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Item</th>
              <th className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Qty</th>
              <th className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="border-b border-slate-200 px-4 py-4">
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.color} • {item.storage} • {item.warranty}</div>
                </td>
                <td className="border-b border-slate-200 px-4 py-4 text-slate-700">{item.quantity}</td>
                <td className="border-b border-slate-200 px-4 py-4 text-slate-700">${((item.price * item.quantity) / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">Serial numbers are retained for warranty claims.</div>
          <button onClick={() => window.print()} className="rounded-full bg-sky-600 px-6 py-3 text-white hover:bg-sky-700">Print Receipt</button>
        </div>
      </div>
    </div>
  );
}
