import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  fetchWishlistIds,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from '../services/wishlistService.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const ids = await fetchWishlistIds();
      setWishlistIds(new Set(ids));
    } catch {
      // non-critical: wishlist heart icons just stay unfilled on failure
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = useCallback((productId) => wishlistIds.has(productId), [wishlistIds]);

  const toggleWishlist = useCallback(
    async (productId) => {
      const alreadyIn = wishlistIds.has(productId);
      try {
        const updatedIds = alreadyIn
          ? await removeFromWishlistApi(productId)
          : await addToWishlistApi(productId);
        setWishlistIds(new Set(updatedIds.map((id) => id.toString())));
        return { success: true, added: !alreadyIn };
      } catch (err) {
        return { success: false, message: err.message };
      }
    },
    [wishlistIds]
  );

  const value = { wishlistIds, loading, isWishlisted, toggleWishlist, refreshWishlist, count: wishlistIds.size };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
};
