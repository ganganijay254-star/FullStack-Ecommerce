import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function SellerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const menuItems = [
    { label: "Dashboard", path: "/seller/dashboard", icon: "📊", end: true },
    { label: "My Products", path: "/seller/products", icon: "📦" },
    { label: "Orders", path: "/seller/orders", icon: "🛒" },
    { label: "Profile", path: "/seller/profile", icon: "👤" },
  ];

  const isRootDashboard =
    location.pathname === "/seller/dashboard" || location.pathname === "/seller/dashboard/";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">🛍️ ShopEase Seller</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">👋 {user?.full_name}</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full uppercase">
              {user?.role}
            </span>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
            >
              View Store
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        <Sidebar role="seller" menuItems={menuItems} onLogout={handleLogout} />

        <main className="flex-1 p-6">
          {isRootDashboard ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Dashboard Overview</h2>
              <p className="text-slate-500 mb-6">Welcome to your seller dashboard, {user?.full_name}.</p>

              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                <p className="text-lg mb-1">📊 Dashboard analytics coming soon.</p>
                <p className="text-sm">
                  Use the sidebar to manage your products and view orders.
                </p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
