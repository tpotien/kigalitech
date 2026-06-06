import AdminLayout from '../../../components/AdminLayout';
import ProductForm from '../../../components/ProductForm';

export default function NewProduct() {
  return (
    <AdminLayout title="Add New Product">
      <ProductForm />
    </AdminLayout>
  );
}
