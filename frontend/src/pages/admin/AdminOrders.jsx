import { useEffect, useState } from "react";
import { orderAPI } from "../../services/api";

const money = (amount) => `₹${Number(amount || 0).toFixed(2)}`;
export default function AdminOrders() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { orderAPI.getOrders().then((r) => setOrders(r.data.orders)).finally(() => setLoading(false)); }, []);
  return <div><p className="text-xs font-bold tracking-widest text-blue-600 uppercase">Transactions</p><h2 className="text-3xl font-bold text-slate-900 mt-1">All orders</h2><p className="text-slate-500 mt-2 mb-6">Every verified payment across the marketplace.</p><div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">{loading ? <p className="p-8 text-slate-500">Loading orders…</p> : orders.length === 0 ? <p className="p-8 text-slate-500">No paid orders yet.</p> : <div className="divide-y divide-slate-100">{orders.map((order) => <article key={order.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 justify-between"><div><div className="flex items-center gap-3"><p className="font-bold text-slate-900">#{order.id}</p><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase">{order.status}</span></div><p className="text-sm text-slate-600 mt-1">{order.customer} · {order.customer_email}</p><p className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleString("en-IN")}</p></div><div className="md:text-right"><p className="font-bold text-slate-900">{money(order.total)}</p><p className="text-sm text-slate-500">{order.items.length} item{order.items.length === 1 ? "" : "s"}</p></div></article>)}</div>}</div></div>;
}
