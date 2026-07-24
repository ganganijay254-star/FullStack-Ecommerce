import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { productAPI } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex flex-col"><Navbar user={user} onLogout={handleLogout} /><div className="flex-1 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div><Footer /></div>;
  }

  if (!product) return null;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-6 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">&larr; Back</button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="bg-slate-100 p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
              {product.image_url && !imageFailed ? (
                <img src={product.image_url} alt={product.name} className="max-w-full max-h-[350px] object-contain rounded-lg" onError={() => setImageFailed(true)} />
              ) : (
                <div className="text-center text-slate-400"><svg className="w-20 h-20 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm">No image available</span></div>
              )}
            </div>
            <div className="p-6 md:p-8 flex flex-col">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase w-fit mb-3">{product.category || "Uncategorized"}</span>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">{product.name}</h1>
              <div className="text-3xl font-bold text-blue-600 mb-4">&#8377;{product.price?.toFixed(2)}</div>
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{inStock ? `${product.stock} in stock` : "Out of stock"}</span>
                <span className="text-slate-500">Seller: <strong>{product.seller_name || "Not specified"}</strong></span>
              </div>
              <div className="mb-6"><h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3><p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{product.description || "No description available."}</p></div>
              <div className="mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-slate-700">Quantity</span><div className="flex items-center border border-slate-300 rounded-lg overflow-hidden"><button aria-label="Decrease quantity" onClick={() => setQuantity((current) => Math.max(1, current - 1))} disabled={quantity <= 1} className="w-10 h-10 text-lg hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer">−</button><span className="w-10 text-center font-medium">{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))} disabled={!inStock || quantity >= product.stock} className="w-10 h-10 text-lg hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed cursor-pointer">+</button></div></div>
                <button onClick={handleAddToCart} disabled={addingToCart || !inStock} className={`w-full py-3 rounded-lg font-semibold text-white transition cursor-pointer ${inStock ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400 cursor-not-allowed"}`}>{addingToCart ? "Adding..." : inStock ? "Add to Cart" : "Out of Stock"}</button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
