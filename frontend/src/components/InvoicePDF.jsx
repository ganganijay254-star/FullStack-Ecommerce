export default function InvoicePDF({ order }) {
  if (!order) return null;

  const invoiceNumber = `INV-${order.id.toString().padStart(6, "0")}`;
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const subtotal = order.items
    ? order.items.reduce((acc, item) => acc + (item.subtotal || item.unit_price * item.quantity), 0)
    : order.total;

  const tax = roundTwo(subtotal * 0.18); // 18% GST estimate
  const shippingCharge = subtotal > 500 ? 0 : 49;
  const grandTotal = order.total || subtotal + tax + shippingCharge;

  function roundTwo(val) {
    return Math.round(val * 100) / 100;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto rounded-xl shadow-lg border border-slate-200 printable-invoice font-sans">
      {/* Action Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 no-print">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-800">📄 Tax Invoice</span>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
            {order.status ? order.status.toUpperCase() : "PAID"}
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
        >
          <span>🖨️ Print / Download PDF</span>
        </button>
      </div>

      {/* Invoice Content (Target for Print) */}
      <div className="space-y-6">
        {/* Header: Company & Invoice Info */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              🛍️ ShopEase
            </h1>
            <p className="text-xs text-slate-500 mt-1">ShopEase Retail E-Commerce Private Limited</p>
            <p className="text-xs text-slate-500">GSTIN: 27AAAAA0000A1Z5 | PAN: AAAAA0000A</p>
            <p className="text-xs text-slate-500">Support: support@shopease.com | +91 1800-123-4567</p>
          </div>

          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">TAX INVOICE</h2>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              Invoice #: <span className="font-mono text-blue-600">{invoiceNumber}</span>
            </p>
            <p className="text-xs text-slate-500">Order ID: #{order.id}</p>
            <p className="text-xs text-slate-500">Date: {orderDate}</p>
          </div>
        </div>

        {/* Billed To & Shipped From */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Customer Details (Billed To)
            </h3>
            <p className="font-semibold text-slate-900 text-sm">{order.customer || "Valued Customer"}</p>
            <p className="text-slate-600 mt-0.5">{order.customer_email || "Customer Email"}</p>
            <p className="text-slate-500 mt-1">Payment Method: Razorpay Online (UPI/Cards/Netbanking)</p>
            <p className="text-slate-500">Payment Status: <span className="text-emerald-600 font-semibold">Verified</span></p>
          </div>

          <div>
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
              Seller & Shipping Address
            </h3>
            <p className="font-semibold text-slate-900">ShopEase Fulfillment Center</p>
            <p className="text-slate-600">Plot 42, Logistics Park, Sector 18</p>
            <p className="text-slate-600">Mumbai, Maharashtra - 400001, India</p>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200">
              <th className="py-3 px-3">#</th>
              <th className="py-3 px-3">Item Description</th>
              <th className="py-3 px-3 text-right">Unit Price</th>
              <th className="py-3 px-3 text-center">Qty</th>
              <th className="py-3 px-3 text-right">Taxable Value</th>
              <th className="py-3 px-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => {
                const itemTotal = item.subtotal || item.unit_price * item.quantity;
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-3 text-right font-mono">₹{item.unit_price?.toLocaleString()}</td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">₹{roundTwo(itemTotal * 0.82).toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-bold font-mono">₹{itemTotal.toLocaleString()}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-500">
                  No items details available.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Summary & Totals */}
        <div className="flex items-start justify-between pt-4 border-t border-slate-200">
          <div className="w-1/2 space-y-2 text-xs text-slate-500">
            <h4 className="font-bold text-slate-700">Terms & Conditions</h4>
            <p>1. Goods once sold are subject to standard return policy within 7 days.</p>
            <p>2. This is a computer-generated tax invoice and does not require a physical signature.</p>
            <div className="pt-2 flex items-center gap-3">
              <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-mono text-center">
                QR CODE
              </div>
              <span className="text-[11px] text-slate-400">Scan to verify digital invoice signature</span>
            </div>
          </div>

          <div className="w-1/3 space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1">
              <span>Items Subtotal:</span>
              <span className="font-mono font-medium">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Estimated GST (18% included):</span>
              <span className="font-mono font-medium">₹{tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Shipping Charge:</span>
              <span className="font-mono text-emerald-600 font-medium">
                {shippingCharge === 0 ? "FREE" : `₹${shippingCharge}`}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-slate-900 text-sm">
              <span>Grand Total:</span>
              <span className="font-mono text-blue-600">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
