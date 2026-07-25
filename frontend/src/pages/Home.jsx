import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { productAPI } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(1);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (sortBy) params.sort_by = sortBy;

      const res = await productAPI.getProducts(params);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, page]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productAPI.getCategories();
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (term) => {
    setSearch((term || "").trim());
    setSearchInput((term || "").trim());
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        user={user}
        onLogout={handleLogout}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:py-9">
        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-800 px-6 py-10 text-white shadow-xl sm:px-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl animate-pulse" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Curated for you</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Find something worth loving.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">Discover quality products from trusted sellers, with a smoother way to browse, compare and buy.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth" })} className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-cyan-50">Explore products</button>
              <span className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-slate-100">Secure checkout · Fast discovery</span>
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <div id="catalogue" className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-semibold">Category:</label>
                <select
                  value={category}
                  onChange={handleCategoryChange}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-semibold">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="latest">Latest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="text-xs font-semibold text-slate-500">
              {pagination ? `${pagination.total} product${pagination.total === 1 ? "" : "s"} found${search ? ` for “${search}”` : ""}` : ""}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white text-center py-20">
            <p className="text-lg font-semibold text-slate-700">No products found.</p>
            <p className="mt-2 text-sm text-slate-500">Try another keyword or clear your filters.</p>
            <button onClick={() => { setSearch(""); setSearchInput(""); setCategory(""); setPage(1); }} className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white cursor-pointer">Clear filters</button>
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
