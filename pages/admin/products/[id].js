import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import ProductForm from '../../../components/ProductForm';
import Link from 'next/link';

export default function EditProduct() {
  const router = useRouter();
  const { query } = router;
  const [product, setProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (query.id) {
      fetch(`/api/admin/products/${query.id}`).then((r) => r.json()).then(setProduct);
    }
  }, [query.id]);

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"?\n\nThis hides the product from the store.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
    router.push('/admin/products');
  }

  async function handleHardDelete() {
    if (!confirm(`PERMANENTLY delete "${product.name}"?\n\nThis cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hard: true }),
    });
    router.push('/admin/products');
  }

  if (!product) return <AdminLayout title="Edit Product"><div className="py-20 text-center text-slate-400">Loading...</div></AdminLayout>;

  return (
    <AdminLayout title={`Edit: ${product.name}`}>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <Link href="/admin/products" className="text-sm text-slate-500 hover:text-sky-600 no-underline flex items-center gap-1">
          ← Back to Products
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
          >
            Hide Product
          </button>
          <button
            onClick={handleHardDelete}
            disabled={deleting}
            className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
          >
            Delete Permanently
          </button>
        </div>
      </div>
      <ProductForm initial={product} />
    </AdminLayout>
  );
}
