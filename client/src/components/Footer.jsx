import React from 'react';
import {Link} from 'react-router-dom'

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-webname">
        <strong>ShopCom</strong>
        <p>Shop Smart. Shop Simple</p>
        <p>A project featuring product browsing, secure authentication, shopping cart management, and order processing.</p>
      </div>
      <div>
        <h4>Shop</h4>
        <ul>
          <li>Electronics</li>
          <li>Clothing</li>
          <li>Books</li>
          <li>Home &amp; Kitchen</li>
        </ul>
      </div>
      <div>
        <h4>Account</h4>
        <ul>
          <Link to="/my-orders" onClick={() => setMenuOpen(false)}>
            <li>My Orders</li>
          </Link>
          <Link to="/profile" onClick={() => setMenuOpen(false)}>
            <li>Profile</li>
          </Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>
            <li>Cart</li>
          </Link>
        </ul>
      </div>
    </div>
    <p className="footer-bottom">&copy; {new Date().getFullYear()} ShopCom — By Sourabh.</p>
  </footer>
);

export default Footer;
