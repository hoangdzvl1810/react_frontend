import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { readCart, writeCart, addCartItem as addCartItemStorage, clearCart as clearCartStorage } from "../utils/cartStorage";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { account } = useAuth();
  const [cart, setCart] = useState(() => readCart());

  const refreshCart = useCallback(() => {
    setCart(readCart());
  }, []);

  useEffect(() => {
    refreshCart();
  }, [account, refreshCart]);

  useEffect(() => {
    const handleCartUpdated = () => {
      refreshCart();
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("storage", handleCartUpdated);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("storage", handleCartUpdated);
    };
  }, [refreshCart]);

  const cartCount = useMemo(() => {
    if (!account) return 0;
    return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cart, account]);

  const addToCart = useCallback((productId, quantity = 1, stock = 9999) => {
    const result = addCartItemStorage(productId, quantity, stock);
    if (result.ok) {
      setCart(readCart());
    }
    return result;
  }, []);

  const updateQuantity = useCallback((productId, quantity, stock = 9999) => {
    const currentCart = readCart();
    const targetId = Number(productId);
    const targetQty = Number(quantity);

    if (targetQty <= 0) {
      const filtered = currentCart.filter((item) => item.productId !== targetId);
      writeCart(filtered);
      setCart(filtered);
      return { ok: true };
    }

    if (targetQty > Number(stock)) {
      return { ok: false, reason: "OUT_OF_STOCK" };
    }

    const updated = currentCart.map((item) =>
      item.productId === targetId ? { ...item, quantity: targetQty } : item
    );
    writeCart(updated);
    setCart(updated);
    return { ok: true };
  }, []);

  const removeFromCart = useCallback((productId) => {
    const currentCart = readCart();
    const filtered = currentCart.filter(
      (item) => item.productId !== Number(productId)
    );
    writeCart(filtered);
    setCart(filtered);
  }, []);

  const clearCart = useCallback(() => {
    clearCartStorage();
    setCart([]);
  }, []);

  const value = {
    cart,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
