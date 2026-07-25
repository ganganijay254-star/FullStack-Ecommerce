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

  const handleLogout = () => {
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
        return "/profile";
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-xl shadow-xs border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">🛍️ ShopEase</span>
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
                placeholder="Search products, brands and categories…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 pr-11 text-xs transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Cart Icon (Visible on ALL viewports) */}
                <Link
                  to="/cart"
                  className="relative text-slate-700 hover:text-blue-600 transition p-1.5 rounded-lg hover:bg-slate-100"
                  title="View Shopping Cart"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {cart.item_count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {cart.item_count}
                    </span>
                  )}
                </Link>

                {/* Wishlist Icon */}
                <Link
                  to="/wishlist"
                  aria-label="Wishlist"
                  className="hidden sm:block text-slate-700 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-slate-100"
                  title="View Wishlist"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
                  </svg>
                </Link>

                {(user.role === "admin" || user.role === "seller") && (
                  <Link
                    to={user.role === "admin" ? "/admin/products" : "/seller/products"}
                    className="hidden lg:block px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
                  >
                    + Add Product
                  </Link>
                )}

                {/* User Menu - Desktop */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-xs font-semibold text-slate-800 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                  >
                    <span>👤 {user.full_name}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : user.role === "seller"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition cursor-pointer"
                  >
                    Logout
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 text-slate-700 hover:text-blue-600 cursor-pointer rounded-lg hover:bg-slate-100"
                  aria-label="Toggle navigation menu"
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 border border-blue-600 rounded-xl hover:bg-blue-50 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
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
          className="md:hidden pb-3 pt-1"
        >
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, brands and categories…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 pr-11 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && user && (
          <div className="md:hidden pb-4 border-t border-slate-100 pt-3">
            <div className="flex flex-col gap-1 text-xs font-semibold text-slate-700">
              <div className="px-3 py-2 bg-slate-50 rounded-xl mb-1 flex items-center justify-between">
                <span>👋 Hello, <strong className="text-slate-900">{user.full_name}</strong></span>
                <span className="uppercase text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                  {user.role}
                </span>
              </div>

              <Link
                to="/profile"
                className="py-2.5 px-3 hover:bg-slate-100 rounded-xl transition flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                👤 My Profile
              </Link>
              <Link
                to="/cart"
                className="py-2.5 px-3 hover:bg-slate-100 rounded-xl transition flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>🛒 Shopping Cart</span>
                {cart.item_count > 0 && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                    {cart.item_count} items
                  </span>
                )}
              </Link>
              <Link
                to="/wishlist"
                className="py-2.5 px-3 hover:bg-slate-100 rounded-xl transition flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                💖 My Wishlist
              </Link>
              <Link
                to="/orders"
                className="py-2.5 px-3 hover:bg-slate-100 rounded-xl transition flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                📦 Order History & Invoices
              </Link>
              {(user.role === "admin" || user.role === "seller") && (
                <Link
                  to={getDashboardLink()}
                  className="py-2.5 px-3 hover:bg-slate-100 rounded-xl transition flex items-center gap-2 text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📊 {user.role === "admin" ? "Admin Panel" : "Seller Workspace"}
                </Link>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="mt-2 text-rose-600 py-2.5 px-3 hover:bg-rose-50 rounded-xl text-left font-bold transition cursor-pointer"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
