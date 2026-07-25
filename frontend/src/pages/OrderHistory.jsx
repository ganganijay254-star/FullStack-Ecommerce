import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { orderAPI } from "../services/api";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI
      .getOrders()
      .then((r) => setOrders(r.data.orders))
      .catch(() => toast.error("Could not load your orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
          Purchases
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-7">Order History</h1>

        {loading ? (
          <div className="grid place-items-center py-20">
            <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <p className="font-semibold text-slate-800 text-lg">No orders yet</p>
            <p className="text-xs text-slate-400 mt-1">Explore our product catalog and place your first order.</p>
            <Link to="/" className="inline-block mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition">
              Start Shopping &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition">
                <header className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-base">Order #{order.id}</p>
                      <span className="inline-flex bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-slate-900 text-base font-mono">
                      {money(order.total)}
                    </span>
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                    >
                      View Details & Invoice &rarr;
                    </Link>
                  </div>
                </header>

                <div className="p-6 space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} × {money(item.unit_price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-slate-800 text-sm font-mono">{money(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
