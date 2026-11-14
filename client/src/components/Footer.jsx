// import React from 'react';
// import { Link } from 'react-router-dom';

// const Footer = () => (
//   <footer className="footer">
//     <div className="footer-inner">
//       <div>
//         <strong>ApnaCart</strong>
//         <p className="footer-tagline">Apni Pasand. Apni Shopping.</p>
//         <p>Your ultimate destination for everyday essentials and trendy finds. Shop what you love, exactly the way you like it.</p>
//       </div>
//       <div>
//         <h4>Shop</h4>
//         <ul>
//           <li><Link to="/products">All Products</Link></li>
//           <li><Link to="/products">Electronics</Link></li>
//           <li><Link to="/products">Clothing</Link></li>
//           <li><Link to="/products">Books</Link></li>
//         </ul>
//       </div>
//       <div>
//         <h4>Account</h4>
//         <ul>
//           <li><Link to="/my-orders">My Orders</Link></li>
//           <li><Link to="/profile">Profile</Link></li>
//           <li><Link to="/cart">Cart</Link></li>
//         </ul>
//       </div>
//       <div>
//         <h4>Company</h4>
//         <ul>
//           <li><Link to="/about">About Us</Link></li>
//           <li><Link to="/contact">Contact</Link></li>
//         </ul>
//       </div>
//     </div>
//     <p className="footer-bottom">&copy; {new Date().getFullYear()} — ApnaCart.</p>
//   </footer>
// );

// export default Footer;


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo1 from '/src/assets/logoNav.webp'


const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="footer">
      {/* ===== Main Footer ===== */}
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-text">
              <img src={logo1} alt="apnaCartLogo" className="logo" />
              <span className="footer-logo-tagline">Apni Pasand. Apni Shopping.</span>
            </span>
          </Link>
          <p className="footer-desc">
            Your ultimate destination for everyday essentials and trendy finds.
            Shop what you love, exactly the way you like it.
          </p>

          {/* <div className="footer-socials">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">📘</a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X / Twitter">𝕏</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">▶️</a>
          </div> */}

          <div className="footer-contact-mini">
            <span>📞 +91 79081 61009</span>
            <span>✉️ support@apnacart.com</span>
          </div>
        </div>

        {/* Shop */}
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/products">New Arrivals</Link></li>
            <li><Link to="/products">Best Sellers</Link></li>
            {/* <li><Link to="/products">Electronics</Link></li>
            <li><Link to="/products">Clothing</Link></li>
            <li><Link to="/products">Books</Link></li> */}
          </ul>
        </div>

        {/* Account */}
        <div className="footer-col">
          <h4>Account</h4>
          <ul>
            <li><Link to="/my-orders">My Orders</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/wishlist">Wishlist</Link></li>
            {/* <li><Link to="/notifications">Notifications</Link></li> */}
          </ul>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            {/* <li><Link to="/about">Careers</Link></li>
            <li><Link to="/about">Privacy Policy</Link></li>
            <li><Link to="/about">Terms & Conditions</Link></li> */}
          </ul>
        </div>
      </div>

      {/* ===== Trust Strip ===== */}
      <div className="footer-trust">
        <span>🚚 Fast Delivery</span>
        <span>🛡️ 100% Secure Payments</span>
        <span>↩️ 7-Day Easy Returns</span>
        <span>💬 24/7 Customer Support</span>
      </div>

      {/* ===== Bottom Bar ===== */}
      <div className="footer-bottom-wrap">
        <p className="footer-bottom">
          © {new Date().getFullYear()} ApnaCart. All rights reserved.
        </p>
        <div className="footer-bottom-links">
          {/* <Link to="/about">Privacy</Link>
          <span>•</span>
          <Link to="/about">Terms</Link>
          <span>•</span>
          <Link to="/contact">Help</Link> 
          <span>•</span> */}
          <span className="footer-made">Made with ❤️ in India</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;