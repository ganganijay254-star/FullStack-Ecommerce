import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { wishlistAPI } from "../services/api";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { wishlistAPI.getItems().then((r) => setItems(r.data.items)).catch(() => toast.error("Could not load wishlist.")).finally(() => setLoading(false)); }, []);
  const remove = async (productId) => { try { await wishlistAPI.removeItem(productId); setItems((current) => current.filter((item) => item.product.id !== productId)); toast.success("Removed from wishlist."); } catch { toast.error("Could not remove item."); } };
  return <div className="min-h-screen bg-slate-50 flex flex-col"><Navbar /><main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8"><div className="mb-7"><p className="text-sm font-semibold tracking-wide text-blue-600 uppercase">Saved for later</p><h1 className="text-3xl font-bold text-slate-900 mt-1">Your wishlist</h1></div>{loading ? <div className="grid place-items-center py-20"><div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div> : items.length === 0 ? <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center"><p className="text-lg font-semibold text-slate-800">Nothing saved yet</p><Link to="/" className="inline-block mt-4 text-blue-600 font-medium">Explore products →</Link></div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{items.map(({ id, product }) => <article key={id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-lg transition duration-300"><Link to={`/products/${product.id}`} className="block aspect-[4/3] bg-slate-100">{product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />}</Link><div className="p-4"><p className="text-xs text-blue-600 font-medium">{product.category || "Uncategorized"}</p><h2 className="font-semibold text-slate-900 mt-1 truncate">{product.name}</h2><p className="font-bold text-lg mt-2">₹{Number(product.price).toFixed(2)}</p><button onClick={() => remove(product.id)} className="mt-4 text-sm text-rose-600 hover:text-rose-700 font-medium cursor-pointer">Remove</button></div></article>)}</div>}</main><Footer /></div>;
}
