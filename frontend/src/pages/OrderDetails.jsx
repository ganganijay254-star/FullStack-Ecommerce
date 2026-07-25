import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { orderAPI, getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import InvoicePDF from "../components/InvoicePDF";

export default function OrderDetails() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleReturnOrder = async () => {
    const isDelivered = order.status === "delivered";
    const msg = isDelivered
      ? "Are you sure you want to request a return for this delivered order?"
      : "Are you sure you want to cancel this order?";
    if (!window.confirm(msg)) return;

    try {
      setActionLoading(true);
      const res = await orderAPI.returnOrder(order.id);
      if (res.success && res.data) {
        toast.success(res.message);
        setOrder(res.data.order);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await orderAPI.getOrderDetails(id);
        if (res.success && res.data) {
          setOrder(res.data.order);
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err));
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) return null;

  const invoiceNumber = `INV-${order.id.toString().padStart(6, "0")}`;
  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  // Order timeline stages
  const stages = ["pending", "confirmed", "packed", "shipped", "delivered"];
  const currentStatus = (order.status || "pending").toLowerCase();
  const currentStageIndex = Math.max(0, stages.indexOf(currentStatus));

  const subtotal = order.items
    ? order.items.reduce((acc, item) => acc + (item.subtotal || item.unit_price * item.quantity), 0)
    : order.total;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const shippingCharge = subtotal > 500 ? 0 : 49;
  const grandTotal = order.total || subtotal + tax + shippingCharge;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link to="/orders" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 mb-1">
              &larr; Back to All Orders
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Order Details</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordered on {orderDate} | Order #{order.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!["cancelled", "returned"].includes(order.status) && (
              <button
                disabled={actionLoading}
                onClick={handleReturnOrder}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : order.status === "delivered" ? "🔄 Request Return" : "❌ Cancel Order"}
              </button>
            )}
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer w-fit"
            >
              <span>📄 Download Tax Invoice</span>
            </button>
          </div>
        </div>

        {/* Amazon-Style Order Status Banner Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Invoice Number</span>
              <p className="text-sm font-mono font-bold text-slate-800">{invoiceNumber}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Payment Method</span>
              <p className="text-sm font-semibold text-slate-800">Razorpay Online (Verified)</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Payment Status</span>
              <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                PAID (₹{grandTotal.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Interactive Order Status Timeline */}
          {currentStatus === "cancelled" ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
              ❌ This order was cancelled.
            </div>
          ) : (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Order Tracking Status Timeline
              </h3>
              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                <div
                  className="absolute top-1/2 left-4 h-1 bg-emerald-500 -translate-y-1/2 transition-all duration-500 z-0"
                  style={{
                    width: `${(currentStageIndex / (stages.length - 1)) * 92}%`,
                  }}
                />

                {stages.map((stage, idx) => {
                  const isCompleted = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stage} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                          isCompleted
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                            : "bg-slate-200 text-slate-500"
                        } ${isCurrent ? "scale-110 ring-4 ring-emerald-300" : ""}`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span className={`text-[11px] font-semibold mt-2 capitalize ${isCompleted ? "text-emerald-700" : "text-slate-400"}`}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Addresses & Payment Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping & Billing Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Shipping & Billing Address
            </h3>
            <p className="font-bold text-slate-900 text-sm">{order.customer || user?.full_name}</p>
            <p className="text-xs text-slate-600 mt-1">{order.customer_email || user?.email}</p>
            <p className="text-xs text-slate-600 mt-2">
              42 Park Avenue, Apartment 8B<br />
              Mumbai, Maharashtra - 400001, India
            </p>
            <p className="text-xs text-slate-500 mt-2">Phone: +91 98765 43210</p>
          </div>

          {/* Price Breakdown Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Price Breakdown
            </h3>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (18%)</span>
                <span className="font-mono text-slate-900">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Charge</span>
                <span className="font-mono text-emerald-600">
                  {shippingCharge === 0 ? "FREE" : `₹${shippingCharge}`}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 font-extrabold text-sm text-slate-900">
                <span>Grand Total</span>
                <span className="font-mono text-blue-600">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Products List Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Ordered Products ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image_url || "https://via.placeholder.com/100"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-slate-50"
                    />
                    <div>
                      <Link
                        to={`/products/${item.product_id}`}
                        className="font-semibold text-slate-900 text-sm hover:text-blue-600 transition line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Quantity: <span className="font-bold text-slate-700">{item.quantity}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Unit Price: ₹{item.unit_price?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ₹{(item.subtotal || item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No item details recorded.</p>
            )}
          </div>
        </div>
      </main>

      {/* Invoice Modal Overlay */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 relative">
            <button
              onClick={() => setShowInvoiceModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer z-10 no-print"
            >
              ✕
            </button>
            <InvoicePDF order={order} />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
