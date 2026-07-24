import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const money = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

export default function Cart() {
  const { user } = useAuth();
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const changeQuantity = async (item, quantity) => {
    if (quantity < 1 || quantity > item.stock) return;
    try {
      await updateItem(item.id, quantity);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update quantity.");
    }
  };

  const remove = async (itemId) => {
    try {
      await removeItem(itemId);
      toast.success("Item removed from cart.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not remove item.");
    }
  };

  const clear = async () => {
    try {
      await clearCart();
      toast.success("Cart cleared.");
    } catch {
      toast.error("Could not clear cart.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Shopping Cart</h1>
          {cart.items.length > 0 && <button onClick={clear} className="text-sm text-red-600 hover:text-red-700 cursor-pointer">Clear cart</button>}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : cart.items.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl text-center py-16 px-4">
            <p className="text-lg font-medium text-slate-700">Your cart is empty.</p>
            <Link to="/" className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Continue shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-3">
              {cart.items.map((item) => (
                <article key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4">
                  <Link to={`/products/${item.product_id}`} className="w-20 h-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-slate-400 text-xs">No image</div>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.product_id}`} className="font-semibold text-slate-800 hover:text-blue-600">{item.name}</Link>
                    <p className="text-sm text-slate-500 mt-1">{money(item.unit_price)} each</p>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                      <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                        <button aria-label="Decrease quantity" onClick={() => changeQuantity(item, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 text-lg disabled:text-slate-300 cursor-pointer disabled:cursor-not-allowed">−</button>
                        <span className="w-9 text-center text-sm">{item.quantity}</span>
                        <button aria-label="Increase quantity" onClick={() => changeQuantity(item, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-8 h-8 text-lg disabled:text-slate-300 cursor-pointer disabled:cursor-not-allowed">+</button>
                      </div>
                      <div className="flex items-center gap-4"><strong className="text-slate-800">{money(item.subtotal)}</strong><button onClick={() => remove(item.id)} className="text-sm text-red-600 hover:text-red-700 cursor-pointer">Remove</button></div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
            <aside className="bg-white border border-slate-200 rounded-xl p-5 h-fit">
              <h2 className="font-semibold text-slate-800 text-lg">Order Summary</h2>
              <div className="flex justify-between text-sm text-slate-600 mt-4"><span>Items ({cart.item_count})</span><span>{money(cart.total)}</span></div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 mt-4 pt-4"><span>Total</span><span>{money(cart.total)}</span></div>
              <button onClick={() => navigate("/")} className="w-full mt-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer">Continue Shopping</button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
