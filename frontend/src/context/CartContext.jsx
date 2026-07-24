import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { cartAPI } from "../services/api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState({ items: [], item_count: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], item_count: 0, total: 0 });
      return;
    }
    setLoading(true);
    try {
      const response = await cartAPI.getCart();
      setCart(response.data.cart);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) refreshCart().catch(() => setCart({ items: [], item_count: 0, total: 0 }));
  }, [authLoading, refreshCart]);

  const addItem = useCallback(async (productId, quantity) => {
    const response = await cartAPI.addItem(productId, quantity);
    setCart(response.data.cart);
    return response;
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    const response = await cartAPI.updateItem(itemId, quantity);
    setCart(response.data.cart);
    return response;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const response = await cartAPI.removeItem(itemId);
    setCart(response.data.cart);
    return response;
  }, []);

  const clearCart = useCallback(async () => {
    const response = await cartAPI.clearCart();
    setCart(response.data.cart);
    return response;
  }, []);

  return (
    <CartContext.Provider value={{ cart, loading, refreshCart, addItem, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
