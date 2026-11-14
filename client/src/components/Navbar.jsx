import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, Heart, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import SearchBar from './SearchBar.jsx';
import NotificationBell from './NotificationBell.jsx';
import logo1 from '/src/assets/logoNav.webp'





const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { cart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (term) => {
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <img src={logo1} alt="apnaCartLogo" className="logo" />
        </Link>

        <div className="navbar-search-desktop">
          <SearchBar onSearch={handleSearch} />
        </div>

        <button
          type="button"
          className="navbar-menu-toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/products" onClick={() => setMenuOpen(false)}>
            Products
          </Link>

          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="navbar-admin-link">
              <LayoutDashboard size={18} aria-hidden="true" />
              Admin
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="navbar-icon-link">
                <Package size={18} aria-hidden="true" />
                My Orders
              </Link>

              <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="navbar-icon-link">
                <Heart size={20} aria-hidden="true" />
                {wishlistCount > 0 && <span className="cart-badge-wish">{wishlistCount}</span>}
              </Link>

              <NotificationBell />

              <Link to="/profile" onClick={() => setMenuOpen(false)} className="navbar-icon-link">
                <User size={18} aria-hidden="true" />
                {user?.name?.split(' ')[0] || 'Profile'}
              </Link>

              <button type="button" className="navbar-icon-link navbar-logout" onClick={handleLogout}>
                <LogOut size={18} aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}

          <Link to="/cart" onClick={() => setMenuOpen(false)} className="navbar-cart">
            <ShoppingCart size={20} aria-hidden="true" />
            {cart.totalItems > 0 && <span className="cart-badge">{cart.totalItems}</span>}
          </Link>
        </nav>
      </div>
      <div className="navbar-search-mobile">
        <SearchBar onSearch={handleSearch} />
      </div>
    </header>
  );
};

export default Navbar;
