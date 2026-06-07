import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import prisma from '../../lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function getServerSideProps({ req }) {
  const token = await getToken({ req });
  if (!token || !['admin', 'staff'].includes(token.role)) {
    return { redirect: { destination: '/signin', permanent: false } };
  }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, image: true, role: true },
    orderBy: { id: 'desc' },
  });
  const orderCounts = await prisma.order.groupBy({ by: ['userId'], _count: { id: true } });
  const countMap = Object.fromEntries(orderCounts.map((o) => [o.userId, o._count.id]));
  return { props: { users: users.map((u) => ({ ...u, orderCount: countMap[u.id] || 0 })) } };
}

export default function AdminUsers({ users }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter((u) => !search || u.email?.includes(search) || u.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Customers">
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3 hidden sm:table-cell">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3 hidden md:table-cell">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {u.image ? (
                      <img src={u.image} alt="" className="h-9 w-9 rounded-full" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                        {(u.name || u.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <p className="font-medium text-slate-900">{u.name || '(no name)'}</p>
                  </div>
                </td>
                <td className="px-5 py-3 hidden sm:table-cell text-slate-600">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'staff' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 hidden md:table-cell text-slate-600">{u.orderCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <div className="py-16 text-center text-slate-400">No customers found.</div>}
      </div>
    </AdminLayout>
  );
}
