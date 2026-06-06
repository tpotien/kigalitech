import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/AdminLayout';
import ProductForm from '../../../components/ProductForm';

export default function EditProduct() {
  const { query } = useRouter();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (query.id) {
      fetch(`/api/admin/products/${query.id}`).then((r) => r.json()).then(setProduct);
    }
  }, [query.id]);

  if (!product) return <AdminLayout title="Edit Product"><div className="py-20 text-center text-slate-400">Loading...</div></AdminLayout>;

  return (
    <AdminLayout title={`Edit: ${product.name}`}>
      <ProductForm initial={product} />
    </AdminLayout>
  );
}
