import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { orderAPI } from "../services/api";

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const root =
    location.pathname === "/seller/dashboard" ||
    location.pathname === "/seller/dashboard/";

  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (root) {
      orderAPI
        .getSellerDashboard()
        .then((res) => setStats(res.data))
        .catch(() => {});
    }
  }, [root]);

  const menuItems = [
    { label: "Dashboard", path: "/seller/dashboard", icon: "⌘", end: true },
    { label: "My Products", path: "/seller/products", icon: "□" },
    { label: "Orders", path: "/seller/orders", icon: "○" },
    { label: "Profile", path: "/profile", icon: "◎" },
  ];

  const cards = [
    ["Total Revenue", `₹${Number(stats?.total_revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, "bg-emerald-600"],
    ["Total Orders", stats?.total_orders || 0, "bg-cyan-600"],
    ["Pending Orders", stats?.pending_orders || 0, "bg-amber-500"],
    ["Delivered", stats?.completed_orders || 0, "bg-blue-600"],
    ["Returned / Cancelled", (stats?.returned_orders || 0) + (stats?.cancelled_orders || 0), "bg-rose-600"],
    ["Total Products", stats?.total_products || 0, "bg-slate-900"],
    ["Low Stock (≤5)", stats?.low_stock_products || 0, "bg-orange-500"],
    ["Out of Stock", stats?.out_of_stock_products || 0, "bg-red-600"],
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-5 py-3">
          <h1 className="text-xl font-black text-slate-900">
            ShopEase <span className="text-emerald-600">Seller Portal</span>
          </h1>
          <div className="flex gap-3 items-center">
            <span className="hidden text-xs text-slate-500 sm:block font-medium">
              Store Owner: <strong className="text-slate-800">{user?.full_name}</strong>
            </span>
            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              View Storefront &rarr;
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <Sidebar
          role="seller"
          menuItems={menuItems}
          onLogout={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        />

        <main className="min-w-0 flex-1 p-5 sm:p-8">
          {root ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Seller Workspace
                  </p>
                  <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
                    Your Store Dashboard
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Live inventory status, sales performance & order metrics.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/seller/products")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    + Add New Product
                  </button>
                </div>
              </div>

              {/* Low Stock Alert Banner */}
              {stats?.low_stock_products > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Low Stock Alert</h4>
                      <p className="text-xs text-amber-700">
                        {stats.low_stock_products} product(s) have 5 or fewer items remaining in inventory.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/seller/products")}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Update Stock &rarr;
                  </button>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {cards.map(([label, value, color]) => (
                  <div
                    key={label}
                    className={`${color} rounded-2xl p-5 text-white shadow-xs transition hover:-translate-y-0.5`}
                  >
                    <p className="text-xs text-white/80 font-medium">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold font-mono">{value}</p>
                  </div>
                ))}
              </div>

              {/* Top Products & Recent Orders Grid */}
              <div className="mt-8 grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-base">Top Performing Products</h3>
                  <div className="mt-4 space-y-3">
                    {stats?.top_products?.length ? (
                      stats.top_products.map((p) => (
                        <div
                          key={p.name}
                          className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                            <p className="text-xs text-slate-500">{p.sales} units sold</p>
                          </div>
                          <p className="font-extrabold text-slate-900 font-mono text-sm">
                            ₹{Number(p.revenue).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No sales data recorded yet.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-base">Recent Customer Orders</h3>
                  <div className="mt-4 space-y-3">
                    {stats?.recent_orders?.length ? (
                      stats.recent_orders.map((o) => (
                        <div
                          key={o.id}
                          className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0 text-sm"
                        >
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              Order #{o.id} · <span className="font-normal text-slate-600">{o.customer}</span>
                            </p>
                            <p className="capitalize text-xs font-semibold text-emerald-600">
                              {o.status}
                            </p>
                          </div>
                          <p className="font-bold text-slate-900 font-mono text-sm">
                            ₹{Number(o.total).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">No recent orders.</p>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
