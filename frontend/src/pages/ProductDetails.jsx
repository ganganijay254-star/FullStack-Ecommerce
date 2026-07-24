import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { productAPI } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from "react-hot-toast";

export default function ProductDetails() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productAPI.getProduct(id);
        setProduct(res.data.product);
      } catch (err) {
        toast.error("Product not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    setAddingToCart(true);
    // UI only — no backend cart implementation yet
    toast.success("Added to cart! (Cart feature coming soon)");
    setTimeout(() => setAddingToCart(false), 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
        >
          &larr; Back
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="bg-slate-100 p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="max-w-full max-h-[350px] object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <svg
                    className="w-20 h-20 mx-auto mb-2 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">No image available</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6 md:p-8 flex flex-col">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase w-fit mb-3">
                {product.category || "Uncategorized"}
              </span>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
                {product.name}
              </h1>

              <div className="text-3xl font-bold text-blue-600 mb-4">
                &#8377;{product.price?.toFixed(2)}
              </div>

              <div className="flex items-center gap-4 mb-4 text-sm">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.stock > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
                {product.seller_name && (
                  <span className="text-slate-500">
                    Sold by: <strong>{product.seller_name}</strong>
                  </span>
                )}
              </div>

              {product.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock <= 0}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition cursor-pointer ${
                    product.stock > 0
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-400 cursor-not-allowed"
                  }`}
                >
                  {addingToCart
                    ? "Adding..."
                    : product.stock > 0
                    ? "Add to Cart"
                    : "Out of Stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
