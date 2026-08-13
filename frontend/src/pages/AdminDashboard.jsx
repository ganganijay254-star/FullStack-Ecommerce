import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { orderAPI, productAPI, adminAPI } from "../services/api";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const root =
    location.pathname === "/admin/dashboard" ||
    location.pathname === "/admin/dashboard/";

  const [stats, setStats] = useState({
    total_orders: 0,
    total_sales: 0,
  });

  const [productsCount, setProductsCount] = useState(0);

  const [usersStats, setUsersStats] = useState({
    total_users: 0,
    active_users: 0,
    sellers: 0,
  });

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!root) return;

    Promise.all([
      orderAPI.getStats(),
      productAPI.getProducts({
        page: 1,
        per_page: 1,
      }),
      adminAPI.getUserStats(),
    ])
      .then(([orders, catalog, uStats]) => {
        setStats(orders.data);

        setProductsCount(
          catalog.data.pagination?.total || 0
        );

        if (uStats.success) {
          setUsersStats(uStats.data);
        }
      })
      .catch(() => {});
  }, [root]);

  const handleExportCSV = async (type) => {
    try {
      setExporting(true);

      const res =
        type === "users"
          ? await adminAPI.exportUsers()
          : await adminAPI.exportOrders();

      if (res.success && res.data) {
        const items = res.data;

        if (!items.length) {
          toast.error("No records available to export.");
          return;
        }

        const keys = Object.keys(items[0]);

        const csvContent =
          "data:text/csv;charset=utf-8," +
          [
            keys.join(","),
            ...items.map((row) =>
              keys
                .map((k) => `"${row[k] || ""}"`)
                .join(",")
            ),
          ].join("\n");

        const encodedUri = encodeURI(csvContent);

        const link = document.createElement("a");

        link.setAttribute("href", encodedUri);

        link.setAttribute(
          "download",
          `${type}_report_${Date.now()}.csv`
        );

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        toast.success(
          `${type.toUpperCase()} CSV exported successfully.`
        );
      }
    } catch {
      toast.error("Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  };

  const menuItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "⌘",
      end: true,
    },
    {
      label: "Products",
      path: "/admin/products",
      icon: "□",
    },
    {
      label: "Users",
      path: "/admin/users",
      icon: "◎",
    },
    {
      label: "Orders",
      path: "/admin/orders",
      icon: "◫",
    },
    {
      label: "Categories",
      path: "/admin/categories",
      icon: "◇",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-100 font-sans overflow-x-hidden">
      {/* =========================================================
          TOP ADMIN NAVBAR
      ========================================================== */}
      <nav className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Logo / Title */}
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate">
              ShopEase{" "}
              <span className="text-blue-600 font-bold">
                Admin Portal
              </span>
            </h1>

            {/* User + Store Button */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 min-w-0">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate max-w-[220px] sm:max-w-none">
                Logged in as{" "}
                <strong className="text-slate-800">
                  {user?.full_name}
                </strong>
              </span>

              <button
                onClick={() => navigate("/")}
                className="shrink-0 px-3 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer whitespace-nowrap"
              >
                View Store &rarr;
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* =========================================================
          MAIN LAYOUT

          MOBILE:
          flex-col
          Sidebar/Nav on top
          Content below

          DESKTOP:
          flex-row
          Sidebar on left
          Content on right
      ========================================================== */}
      <div className="flex flex-col lg:flex-row w-full min-w-0">
        
        {/* =======================================================
            SIDEBAR
        ======================================================== */}
        <div className="w-full lg:w-auto shrink-0">
          <Sidebar
            role="admin"
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
        <main className="flex-1 min-w-0 w-full p-3 sm:p-5 md:p-6 lg:p-8 overflow-x-hidden">
          
          {root ? (
            <>
              {/* =================================================
                  DASHBOARD HEADER
              ================================================== */}
              <div className="flex flex-col gap-4 mb-6 sm:mb-7 lg:flex-row lg:items-center lg:justify-between">
                
                {/* Heading */}
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold tracking-widest text-blue-600 uppercase">
                    Platform Analytics
                  </p>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 break-words">
                    Welcome back,{" "}
                    {user?.full_name?.split(" ")[0]}.
                  </h2>

                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                    Real-time operational summary & financial
                    breakdown.
                  </p>
                </div>

                {/* Export Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  
                  <button
                    disabled={exporting}
                    onClick={() =>
                      handleExportCSV("orders")
                    }
                    className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    📥 Export Orders CSV
                  </button>

                  <button
                    disabled={exporting}
                    onClick={() =>
                      handleExportCSV("users")
                    }
                    className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    📥 Export Users CSV
                  </button>
                </div>
              </div>

              {/* =================================================
                  STATISTICS CARDS
              ================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                
                {/* Total Revenue */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Revenue
                  </span>

                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono break-all">
                    ₹
                    {Number(
                      stats.total_sales || 0
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>

                  <span className="text-[10px] sm:text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                    ↑ Lifetime Sales
                  </span>
                </div>

                {/* Total Orders */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Orders
                  </span>

                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono break-all">
                    {stats.total_orders || 0}
                  </p>

                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-1 inline-block">
                    Verified Checkouts
                  </span>
                </div>

                {/* Active Products */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Active Products
                  </span>

                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono break-all">
                    {productsCount}
                  </p>

                  <span className="text-[10px] sm:text-[11px] text-blue-600 font-semibold mt-1 inline-block">
                    Catalog items
                  </span>
                </div>

                {/* Total Users */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Users
                  </span>

                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-mono break-all">
                    {usersStats.total_users || 0}
                  </p>

                  <span className="text-[10px] sm:text-[11px] text-purple-600 font-semibold mt-1 inline-block break-words">
                    {usersStats.sellers || 0} Sellers |{" "}
                    {usersStats.active_users || 0} Active
                  </span>
                </div>
              </div>

              {/* =================================================
                  QUICK ACTIONS
              ================================================== */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
                
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Quick Administration Shortcuts
                </h3>

                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mt-4">
                  
                  <button
                    onClick={() =>
                      navigate("/admin/products")
                    }
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    Manage Product Catalog &rarr;
                  </button>

                  <button
                    onClick={() =>
                      navigate("/admin/users")
                    }
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    Manage Users & Sellers &rarr;
                  </button>

                  <button
                    onClick={() =>
                      navigate("/admin/orders")
                    }
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition"
                  >
                    Review All Orders &rarr;
                  </button>
                </div>
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
