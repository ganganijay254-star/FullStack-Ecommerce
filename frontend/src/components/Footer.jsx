import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">🛍️ ShopEase</h3>
            <p className="text-sm text-slate-400">
              Your one-stop shop for everything you need. Quality products at
              great prices.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-white transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>📧 support@shopease.com</li>
              <li>📞 +1 234 567 8900</li>
              <li>📍 123 Commerce St, City</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-sm text-slate-500">
          &copy; {currentYear} ShopEase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

