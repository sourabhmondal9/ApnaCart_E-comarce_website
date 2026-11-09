import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-webname">
        <strong>ApnaCart</strong>
        <p>Apni Pasand. Apni Shoping.</p>
        <p>Your ultimate destination for everyday essentials and trendy finds. Shop what you love, exactly the way you like it.</p>
      </div>
      <div>
        <h4>Shop</h4>
        <ul>
          <li><Link to="/products">All Products</Link></li>
          <li><Link to="/products">Electronics</Link></li>
          <li><Link to="/products">Clothing</Link></li>
          <li><Link to="/products">Books</Link></li>
        </ul>
      </div>
      <div>
        <h4>Account</h4>
        <ul>
          <li><Link to="/my-orders">My Orders</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/cart">Cart</Link></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
      </div>
    </div>
    <p className="footer-bottom">&copy; {new Date().getFullYear()} ApnaCart — By Sourabh.</p>
  </footer>
);

export default Footer;
