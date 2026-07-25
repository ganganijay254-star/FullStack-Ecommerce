import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { orderAPI } from "../services/api";

const money = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

export default function Cart() {
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

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

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const ready = await loadRazorpay();
      if (!ready) throw new Error("Checkout could not be loaded.");
      const response = await orderAPI.createCheckout();
      console.log(response);
      const payment = new window.Razorpay({
        key: response.data.key, amount: response.data.amount, currency: response.data.currency,
        name: "ShopEase", description: "Secure test payment", order_id: response.data.order_id,
        theme: { color: "#2563eb" },
        handler: async (paymentResponse) => {
          try { await orderAPI.verifyPayment(paymentResponse); await clearCart(); toast.success("Payment verified. Your order is confirmed!"); navigate("/orders"); }
          catch (error) { toast.error(error.response?.data?.message || "Payment could not be verified."); }
        },
        modal: { ondismiss: () => setCheckingOut(false) },
      });
      payment.open();
    } catch (error) { toast.error(error.response?.data?.message || error.message || "Could not start checkout."); }
    finally { setCheckingOut(false); }
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
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold text-slate-900">{money(item.unit_price)} each</p>
                      {item.discount_percent > 0 && item.original_price > item.unit_price && (
                        <span className="text-xs text-slate-400 line-through font-normal">
                          {money(item.original_price)}
                        </span>
                      )}
                      {item.discount_percent > 0 && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded">
                          -{item.discount_percent}% OFF
                        </span>
                      )}
                    </div>
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
              
              {/* Delivery Estimation Box */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                <span className="text-lg">🚚</span>
                <div>
                  <p className="text-xs font-bold text-blue-900">Estimated Delivery: 3 to 4 Days</p>
                  <p className="text-[11px] text-blue-700">Orders placed now ship with auto-confirmation.</p>
                </div>
              </div>

              <div className="flex justify-between text-sm text-slate-600 mt-4"><span>Items ({cart.item_count})</span><span>{money(cart.total)}</span></div>
              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 mt-4 pt-4"><span>Total</span><span>{money(cart.total)}</span></div>
              <button onClick={checkout} disabled={checkingOut} className="w-full mt-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold cursor-pointer">{checkingOut ? "Opening checkout..." : "Secure Checkout"}</button>
              <button onClick={() => navigate("/")} className="w-full mt-2 py-2 text-sm text-slate-600 hover:text-blue-600 cursor-pointer">Continue shopping</button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
