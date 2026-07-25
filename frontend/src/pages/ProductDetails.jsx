import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { productAPI, wishlistAPI } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StarRating from "../components/StarRating";
import ReviewSection from "../components/ReviewSection";

export default function ProductDetails() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setImageFailed(false);
      try {
        const res = await productAPI.getProduct(id);
        setProduct(res.data.product);
        setQuantity(1);
      } catch {
        toast.error("Product not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity);
      toast.success("Added to cart.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add this product to your cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    setWishlisting(true);
    try { await wishlistAPI.addItem(product.id); toast.success("Saved to your wishlist."); }
    catch (error) { toast.error(error.response?.data?.message || "Could not save this item."); }
    finally { setWishlisting(false); }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex flex-col"><Navbar user={user} onLogout={handleLogout} /><div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div><Footer /></div>;
  }

  if (!product) return null;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-6 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer">&larr; Back to Products</button>
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="bg-slate-50 p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
              {product.image_url && !imageFailed ? (
                <img src={product.image_url} alt={product.name} className="max-w-full max-h-[350px] object-contain rounded-xl shadow-xs" onError={() => setImageFailed(true)} />
              ) : (
                <div className="text-center text-slate-400"><svg className="w-20 h-20 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm">No image available</span></div>
              )}
            </div>
            <div className="p-6 md:p-8 flex flex-col">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full uppercase w-fit mb-3">{product.category || "Uncategorized"}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
              
              {/* Rating header preview */}
              <div className="flex items-center gap-2 mb-4">
                <StarRating rating={product.avg_rating || 0} size="sm" />
                <span className="text-sm font-semibold text-slate-800">
                  {product.avg_rating ? product.avg_rating.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs text-slate-500">
                  ({product.review_count || 0} ratings)
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                <span className="text-3xl font-extrabold text-slate-900">&#8377;{product.price?.toFixed(2)}</span>
                {product.discount_percent > 0 && product.original_price > product.price && (
                  <>
                    <span className="text-lg text-slate-400 line-through">&#8377;{product.original_price?.toFixed(2)}</span>
                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200">
                      {product.discount_percent}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* 3-4 Day Delivery Estimate Badge */}
              <div className="mb-5 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="text-xs font-bold text-blue-900">Standard Delivery (3 - 4 Days)</p>
                  <p className="text-[11px] text-blue-700">Orders placed today automatically ship with end-to-end tracking.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${inStock ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{inStock ? `${product.stock} in stock` : "Out of stock"}</span>
                <span className="text-slate-500 text-xs">Seller: <strong className="text-slate-700">{product.seller_name || "Official Store"}</strong></span>
              </div>
              <div className="mb-6"><h3 className="text-sm font-semibold text-slate-800 mb-2">Description</h3><p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{product.description || "No description available."}</p></div>
              <div className="mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-slate-700">Quantity</span><div className="flex items-center border border-slate-300 rounded-xl overflow-hidden"><button aria-label="Decrease quantity" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity <= 1} className="w-10 h-10 text-lg hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer">−</button><span className="w-10 text-center font-semibold text-sm">{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))} disabled={!inStock || quantity >= product.stock} className="w-10 h-10 text-lg hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer">+</button></div></div>
                <div className="grid grid-cols-[1fr_auto] gap-3"><button onClick={handleAddToCart} disabled={addingToCart || !inStock} className={`py-3 rounded-xl font-semibold text-white transition cursor-pointer shadow-xs ${inStock ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400 cursor-not-allowed"}`}>{addingToCart ? "Adding..." : inStock ? "Add to Cart" : "Out of Stock"}</button><button onClick={handleWishlist} disabled={wishlisting} aria-label="Add to wishlist" className="px-4 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer">♡</button></div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews & Rating System */}
        <ReviewSection
          productId={product.id}
          onRatingUpdate={(avg, count) => {
            setProduct((prev) => prev ? { ...prev, avg_rating: avg, review_count: count } : prev);
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
