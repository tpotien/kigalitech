import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

export default function CartPage() {
  const { items, subtotal, removeItem, updateQty } = useCart();
  const { format } = useCurrency();
  const router = useRouter();

  const shipping = subtotal >= 75000 ? 0 : 5000;
  const total = subtotal + shipping;

  return (
    <Layout>
      <div className="max-w-container mx-auto px-4 lg:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-ex-muted flex items-center gap-2 mb-10">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-ex-text font-medium">Cart</span>
        </nav>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="text-2xl font-semibold text-ex-text mb-3">Your cart is empty</h2>
            <p className="text-ex-muted text-sm mb-8">Looks like you haven't added anything yet.</p>
            <Link href="/products" className="btn-primary inline-block">Return To Shop</Link>
          </div>
        ) : (
          <>
            {/* ── Cart Table ── */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="bg-ex-gray text-left py-4 px-6 text-sm font-medium text-ex-text rounded-l w-1/2">Product</th>
                    <th className="bg-ex-gray text-left py-4 px-6 text-sm font-medium text-ex-text">Price</th>
                    <th className="bg-ex-gray text-left py-4 px-6 text-sm font-medium text-ex-text">Quantity</th>
                    <th className="bg-ex-gray text-left py-4 px-6 text-sm font-medium text-ex-text rounded-r">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.key} className="border-b border-ex-border">
                      {/* Product */}
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => removeItem(item.key)}
                            className="flex-shrink-0 h-5 w-5 rounded-full bg-ex-text text-white flex items-center justify-center hover:bg-primary transition-colors"
                            title="Remove"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <div className="h-16 w-16 bg-ex-gray rounded flex items-center justify-center flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-14 w-14 object-contain" onError={e => e.target.style.display='none'} />
                            ) : (
                              <span className="text-2xl opacity-30">📦</span>
                            )}
                          </div>
                          <span className="text-sm text-ex-text line-clamp-2 max-w-[220px]">{item.name}</span>
                        </div>
                      </td>
                      {/* Price */}
                      <td className="py-6 px-6 text-sm text-ex-text whitespace-nowrap">{format(item.price)}</td>
                      {/* Quantity */}
                      <td className="py-6 px-6">
                        <div className="inline-flex items-center border border-ex-border rounded">
                          <button
                            onClick={() => item.quantity > 1 ? updateQty(item.key, item.quantity - 1) : removeItem(item.key)}
                            className="w-9 h-9 flex items-center justify-center text-ex-text hover:text-primary transition-colors text-lg"
                          >
                            −
                          </button>
                          <span className="w-10 h-9 flex items-center justify-center text-sm font-medium text-ex-text border-x border-ex-border">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.key, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center text-ex-text hover:text-primary transition-colors text-lg"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      {/* Subtotal */}
                      <td className="py-6 px-6 text-sm font-medium text-ex-text whitespace-nowrap">
                        {format(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Action row ── */}
            <div className="flex items-center justify-between mb-14">
              <Link href="/products"
                className="px-10 py-3 rounded border border-ex-border text-sm font-medium text-ex-text hover:border-primary hover:text-primary transition-colors">
                Return To Shop
              </Link>
              <button
                onClick={() => {}}
                className="px-10 py-3 rounded border border-ex-border text-sm font-medium text-ex-text hover:border-primary hover:text-primary transition-colors">
                Update Cart
              </button>
            </div>

            {/* ── Coupon + Cart Total ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Coupon code */}
              <form onSubmit={e => e.preventDefault()} className="flex gap-4">
                <input
                  type="text"
                  placeholder="Coupon Code"
                  className="flex-1 border border-ex-border rounded px-5 py-3.5 text-sm text-ex-text outline-none focus:border-primary placeholder:text-ex-muted"
                />
                <button type="submit" className="btn-primary whitespace-nowrap px-8">
                  Apply Coupon
                </button>
              </form>

              {/* Cart Totals */}
              <div className="border border-ex-border rounded p-7">
                <h3 className="text-lg font-semibold text-ex-text mb-6">Cart Total</h3>

                <div className="flex items-center justify-between py-4 border-b border-ex-border">
                  <span className="text-sm text-ex-text">Subtotal:</span>
                  <span className="text-sm text-ex-text">{format(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-ex-border">
                  <span className="text-sm text-ex-text">Shipping:</span>
                  <span className="text-sm text-ex-text">
                    {shipping === 0
                      ? <span className="text-green-600 font-medium">Free</span>
                      : format(shipping)}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-xs text-ex-muted mt-1 mb-2">
                    Free shipping on orders over {format(75000)}
                  </p>
                )}

                <div className="flex items-center justify-between py-4">
                  <span className="text-sm font-medium text-ex-text">Total:</span>
                  <span className="text-sm font-semibold text-ex-text">{format(total)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="btn-primary w-full text-center block mt-4"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
