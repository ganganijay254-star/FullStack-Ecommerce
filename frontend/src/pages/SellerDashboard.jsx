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
    {
      label: "Dashboard",
      path: "/seller/dashboard",
      icon: "⌘",
      end: true,
    },
    {
      label: "My Products",
      path: "/seller/products",
      icon: "□",
    },
    {
      label: "Orders",
      path: "/seller/orders",
      icon: "○",
    },
    {
      label: "Profile",
      path: "/profile",
      icon: "◎",
    },
  ];

  const cards = [
    [
      "Total Revenue",
      `₹${Number(stats?.total_revenue || 0).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
        }
      )}`,
      "bg-emerald-600",
    ],
    [
      "Total Orders",
      stats?.total_orders || 0,
      "bg-cyan-600",
    ],
    [
      "Pending Orders",
      stats?.pending_orders || 0,
      "bg-amber-500",
    ],
    [
      "Delivered",
      stats?.completed_orders || 0,
      "bg-blue-600",
    ],
    [
      "Returned / Cancelled",
      (stats?.returned_orders || 0) +
        (stats?.cancelled_orders || 0),
      "bg-rose-600",
    ],
    [
      "Total Products",
      stats?.total_products || 0,
      "bg-slate-900",
    ],
    [
      "Low Stock (≤5)",
      stats?.low_stock_products || 0,
      "bg-orange-500",
    ],
    [
      "Out of Stock",
      stats?.out_of_stock_products || 0,
      "bg-red-600",
    ],
  ];

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans overflow-x-hidden">
      {/* =========================================================
          TOP SELLER NAVBAR
      ========================================================== */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Logo / Title */}
            <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              ShopEase{" "}
              <span className="text-emerald-600">
                Seller Portal
              </span>
            </h1>

            {/* User + Storefront */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[220px] sm:max-w-none">
                Store Owner:{" "}
                <strong className="text-slate-800">
                  {user?.full_name}
                </strong>
              </span>

              <button
                onClick={() => navigate("/")}
                className="shrink-0 rounded-xl bg-slate-100 px-3 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer whitespace-nowrap"
              >
                View Storefront &rarr;
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* =========================================================
          MAIN RESPONSIVE LAYOUT

          MOBILE / TABLET:
          Sidebar navigation on top
          Dashboard content below

          DESKTOP:
          Sidebar on left
          Dashboard content on right
      ========================================================== */}
      <div className="flex flex-col lg:flex-row w-full min-w-0">
        
        {/* =======================================================
            SIDEBAR
        ======================================================== */}
        <div className="w-full lg:w-auto shrink-0">
          <Sidebar
            role="seller"
            menuItems={menuItems}
            onLogout={() => {
              logout();
              navigate("/login", {
                replace: true,
              });
            }}
          />
        </div>

        {/* =======================================================
            MAIN CONTENT
        ======================================================== */}
        <main className="min-w-0 flex-1 w-full p-3 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden">
          
          {root ? (
            <>
              {/* =================================================
                  DASHBOARD HEADER
              ================================================== */}
              <div className="flex flex-col gap-4 mb-6 sm:mb-7 lg:flex-row lg:items-center lg:justify-between">
                
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600">
                    Seller Workspace
                  </p>

                  <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 break-words">
                    Your Store Dashboard
                  </h2>

                  <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                    Live inventory status, sales performance &
                    order metrics.
                  </p>
                </div>

                {/* Add Product Button */}
                <div className="w-full lg:w-auto">
                  <button
                    onClick={() =>
                      navigate("/seller/products")
                    }
                    className="w-full lg:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
                  >
                    + Add New Product
                  </button>
                </div>
              </div>

              {/* =================================================
                  LOW STOCK ALERT
              ================================================== */}
              {stats?.low_stock_products > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">
                        ⚠️
                      </span>

                      <div className="min-w-0">
                        <h4 className="font-bold text-amber-900 text-sm">
                          Low Stock Alert
                        </h4>

                        <p className="text-xs text-amber-700 mt-0.5">
                          {stats.low_stock_products}{" "}
                          product(s) have 5 or fewer items
                          remaining in inventory.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        navigate("/seller/products")
                      }
                      className="w-full sm:w-auto shrink-0 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
                    >
                      Update Stock &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================
                  METRICS GRID
              ================================================== */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {cards.map(([label, value, color]) => (
                  <div
                    key={label}
                    className={`${color} rounded-2xl p-4 sm:p-5 text-white shadow-xs transition hover:-translate-y-0.5 min-w-0`}
                  >
                    <p className="text-[11px] sm:text-xs text-white/80 font-medium break-words">
                      {label}
                    </p>

                    <p className="mt-2 text-xl sm:text-2xl font-extrabold font-mono break-all">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* =================================================
                  TOP PRODUCTS + RECENT ORDERS
              ================================================== */}
              <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
                
                {/* =================================================
                    TOP PERFORMING PRODUCTS
                ================================================== */}
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
                  
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Top Performing Products
                  </h3>

                  <div className="mt-4 space-y-3">
                    {stats?.top_products?.length ? (
                      stats.top_products.map((p) => (
                        <div
                          key={p.name}
                          className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {p.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {p.sales} units sold
                            </p>
                          </div>

                          <p className="shrink-0 font-extrabold text-slate-900 font-mono text-xs sm:text-sm">
                            ₹
                            {Number(
                              p.revenue
                            ).toLocaleString("en-IN")}
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

                {/* =================================================
                    RECENT CUSTOMER ORDERS
                ================================================== */}
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
                  
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Recent Customer Orders
                  </h3>

                  <div className="mt-4 space-y-3">
                    {stats?.recent_orders?.length ? (
                      stats.recent_orders.map((o) => (
                        <div
                          key={o.id}
                          className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm break-words">
                              Order #{o.id} ·{" "}
                              <span className="font-normal text-slate-600">
                                {o.customer}
                              </span>
                            </p>

                            <p className="capitalize text-xs font-semibold text-emerald-600 mt-1">
                              {o.status}
                            </p>
                          </div>

                          <p className="shrink-0 font-bold text-slate-900 font-mono text-xs sm:text-sm">
                            ₹
                            {Number(
                              o.total
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        No recent orders.
                      </p>
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
