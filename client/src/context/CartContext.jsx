import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  fetchCart,
  addToCart as addToCartApi,
  updateCartItemQty as updateCartItemQtyApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi,
} from '../services/cartService.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], subtotal: 0, totalItems: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addItem = useCallback(async (productId, quantity = 1) => {
    setError(null);
    try {
      const data = await addToCartApi(productId, quantity);
      setCart(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  const updateItemQty = useCallback(async (productId, quantity) => {
    setError(null);
    try {
      const data = await updateCartItemQtyApi(productId, quantity);
      setCart(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    setError(null);
    try {
      const data = await removeFromCartApi(productId);
      setCart(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  const emptyCart = useCallback(async () => {
    const data = await clearCartApi();
    setCart(data);
  }, []);

  // Load/clear the cart whenever auth state changes (login, logout, bootstrap)
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value = { cart, loading, error, refreshCart, addItem, updateItemQty, removeItem, emptyCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
