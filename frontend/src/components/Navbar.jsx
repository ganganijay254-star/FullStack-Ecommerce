import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart } = useCart();

  console.log("[Navbar] Rendering - user:", user?.id, user?.role, "path:", window.location.pathname);

  const handleLogout = () => {
    console.log("[Navbar] handleLogout called");
    logout();
    navigate("/login", { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm.trim());
    } else {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "seller":
        return "/seller/dashboard";
      default:
        return "/";
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl font-bold text-slate-800">🛍️ ShopEase</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md mx-8"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/cart"
                  className="relative text-slate-600 hover:text-blue-600 transition hidden sm:block"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {cart.item_count > 0 && <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">{cart.item_count}</span>}
                </Link>
                <Link to="/wishlist" aria-label="Wishlist" className="hidden sm:block text-slate-600 hover:text-rose-600 transition">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></svg>
                </Link>
                {(user.role === "admin" || user.role === "seller") && (
                  <Link to={user.role === "admin" ? "/admin/products" : "/seller/products"} className="hidden lg:block px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition">Add Product</Link>
                )}

                {/* User Menu - Desktop */}
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to={getDashboardLink()}
                    className="text-sm text-slate-600 hover:text-blue-600 transition"
                  >
                    {user.full_name}
                  </Link>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full uppercase ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : user.role === "seller"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {user.role}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition cursor-pointer"
                  >
                    Logout
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-slate-600 hover:text-blue-600 cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="md:hidden pb-3"
        >
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Mobile Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden pb-3 border-t border-slate-100 pt-3">
            <div className="flex flex-col gap-2">
              <Link
                to={getDashboardLink()}
                className="text-sm text-slate-700 py-2 px-2 hover:bg-slate-50 rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link to="/orders" className="text-sm text-slate-700 py-2 px-2 hover:bg-slate-50 rounded" onClick={() => setMobileMenuOpen(false)}>My orders</Link>
              {(user.role === "admin" || user.role === "seller") && <Link to={user.role === "admin" ? "/admin/products" : "/seller/products"} className="text-sm text-slate-700 py-2 px-2 hover:bg-slate-50 rounded" onClick={() => setMobileMenuOpen(false)}>Add product</Link>}
              <span className="text-sm text-slate-500 px-2">
                👋 {user.full_name}
              </span>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-sm text-red-600 py-2 px-2 hover:bg-red-50 rounded text-left cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

