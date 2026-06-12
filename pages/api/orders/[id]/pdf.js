import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const RWF_RATE = 1475;
const toRwf = (cents) => Math.round((cents / 100) * RWF_RATE);
const fmt = (cents) => `RWF ${toRwf(cents).toLocaleString()}`;

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b', backgroundColor: '#ffffff', paddingHorizontal: 40, paddingVertical: 36 },

  // Header bar
  headerBar:   { backgroundColor: '#0f172a', borderRadius: 6, padding: '16 20', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  brand:       { color: '#ffffff', fontSize: 22, fontFamily: 'Helvetica-Bold' },
  brandSub:    { color: '#7dd3fc', fontSize: 9, marginTop: 2 },
  invNum:      { color: '#38bdf8', fontSize: 20, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  invLabel:    { color: '#94a3b8', fontSize: 8, textAlign: 'right', marginBottom: 2 },

  // Info grid (2 columns)
  infoGrid:    { flexDirection: 'row', gap: 20, marginBottom: 20 },
  infoBlock:   { flex: 1 },
  infoLabel:   { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3, fontFamily: 'Helvetica-Bold' },
  infoVal:     { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#1e293b', marginBottom: 1 },
  infoSub:     { fontSize: 9, color: '#64748b' },

  // Table
  table:       { marginBottom: 20 },
  thead:       { backgroundColor: '#0f172a', flexDirection: 'row', padding: '8 10' },
  th:          { fontSize: 8, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1, fontFamily: 'Helvetica-Bold' },
  thR:         { fontSize: 8, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  trowEven:    { flexDirection: 'row', padding: '9 10', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', borderBottomStyle: 'solid' },
  trowOdd:     { flexDirection: 'row', padding: '9 10', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', borderBottomStyle: 'solid' },
  tdNum:       { fontSize: 9, flex: 0.3, color: '#94a3b8' },
  tdItem:      { fontSize: 10, flex: 3, fontFamily: 'Helvetica-Bold' },
  tdSub:       { fontSize: 8, color: '#64748b', marginTop: 1 },
  tdVariant:   { fontSize: 9, flex: 1.2, color: '#64748b' },
  tdQty:       { fontSize: 10, flex: 0.6, textAlign: 'right' },
  tdPrice:     { fontSize: 10, flex: 1.2, textAlign: 'right' },
  tdTotal:     { fontSize: 10, flex: 1.2, textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  // Totals
  totalsWrap:  { width: 240, marginLeft: 'auto', marginBottom: 28 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', padding: '6 10', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', borderBottomStyle: 'solid' },
  totalLabel:  { fontSize: 10, color: '#64748b' },
  totalVal:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  grandRow:    { flexDirection: 'row', justifyContent: 'space-between', padding: '10 10', backgroundColor: '#0f172a', borderRadius: 4 },
  grandLabel:  { fontSize: 11, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  grandVal:    { fontSize: 13, color: '#38bdf8', fontFamily: 'Helvetica-Bold' },

  // Footer
  footer:      { borderTopWidth: 1, borderTopColor: '#e2e8f0', borderTopStyle: 'solid', paddingTop: 12, textAlign: 'center', color: '#94a3b8', fontSize: 9 },
  footerBold:  { fontFamily: 'Helvetica-Bold', color: '#64748b' },
});

function InvoicePDF({ order, items }) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <Document title={`Invoice #${order.id} — KigaliTech`} author="KigaliTech">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerBar}>
          <View>
            <Text style={s.brand}>KigaliTech</Text>
            <Text style={s.brandSub}>Kigali, Rwanda · kigalitechservices@gmail.com · +250 786 276 555</Text>
          </View>
          <View>
            <Text style={s.invLabel}>INVOICE</Text>
            <Text style={s.invNum}>#{order.id}</Text>
          </View>
        </View>

        {/* Info grid */}
        <View style={s.infoGrid}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Bill To</Text>
            <Text style={s.infoVal}>{order.shippingName || 'Customer'}</Text>
            {order.shippingEmail ? <Text style={s.infoSub}>{order.shippingEmail}</Text> : null}
            {order.shippingPhone ? <Text style={s.infoSub}>{order.shippingPhone}</Text> : null}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Delivery Address</Text>
            <Text style={s.infoVal}>{order.mpostAddress ? `Mpost: ${order.mpostAddress}` : (order.shippingAddress || '—')}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Payment Method</Text>
            <Text style={s.infoVal}>{order.paymentMethod || 'Pending'}</Text>
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Date · Status</Text>
            <Text style={s.infoVal}>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <Text style={[s.infoSub, { color: order.paymentConfirmed ? '#16a34a' : '#d97706' }]}>
              {order.paymentConfirmed ? 'Payment Confirmed' : 'Payment Pending'}
            </Text>
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, { flex: 0.3 }]}>#</Text>
            <Text style={[s.th, { flex: 3 }]}>Item</Text>
            <Text style={[s.th, { flex: 1.2 }]}>Variant</Text>
            <Text style={[s.thR, { flex: 0.6 }]}>Qty</Text>
            <Text style={[s.thR, { flex: 1.2 }]}>Unit Price</Text>
            <Text style={[s.thR, { flex: 1.2 }]}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? s.trowEven : s.trowOdd}>
              <Text style={s.tdNum}>{i + 1}</Text>
              <View style={{ flex: 3 }}>
                <Text style={s.tdItem}>{item.name}</Text>
                {item.serial && item.serial !== 'TBD'
                  ? <Text style={s.tdSub}>S/N: {item.serial}</Text>
                  : null}
              </View>
              <Text style={s.tdVariant}>{[item.color, item.storage, item.warranty ? `Warranty: ${item.warranty}` : ''].filter(Boolean).join(' · ')}</Text>
              <Text style={s.tdQty}>{item.quantity}</Text>
              <Text style={s.tdPrice}>{fmt(item.price)}</Text>
              <Text style={s.tdTotal}>{fmt(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsWrap}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalVal}>{fmt(subtotal)}</Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: '#16a34a' }]}>
                Discount{order.couponCode ? ` (${order.couponCode})` : ''}
              </Text>
              <Text style={[s.totalVal, { color: '#16a34a' }]}>−{fmt(order.discountAmount)}</Text>
            </View>
          )}
          {order.tvInstallation && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TV Installation</Text>
              <Text style={s.totalVal}>Negotiable</Text>
            </View>
          )}
          {order.deliveryFee > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Delivery</Text>
              <Text style={s.totalVal}>{fmt(order.deliveryFee)}</Text>
            </View>
          )}
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>TOTAL</Text>
            <Text style={s.grandVal}>{fmt(order.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>Thank you for shopping with <Text style={s.footerBold}>KigaliTech</Text>. This is a computer-generated invoice.</Text>
          <Text style={{ marginTop: 3 }}>For queries, contact us at kigalitechservices@gmail.com or call +250 786 276 555</Text>
        </View>

      </Page>
    </Document>
  );
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const token = await getToken({ req });
  const { id } = req.query;

  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { items: { include: { product: { select: { images: true } } } } },
  });

  if (!order) return res.status(404).end();
  if (!token || (token.sub !== String(order.userId) && !['admin', 'staff'].includes(token.role))) {
    return res.status(403).end();
  }

  const buffer = await renderToBuffer(<InvoicePDF order={order} items={order.items} />);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="KigaliTech-Invoice-${order.id}.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
}
