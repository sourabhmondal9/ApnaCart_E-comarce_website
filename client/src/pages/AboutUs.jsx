import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Headphones, Award } from 'lucide-react';

const AboutUs = () => (
  <div className="static-page">
    <h1>About ShopCom</h1>
    <p className="static-page-lead">
      ShopCom is an academic e-commerce project built to demonstrate a complete, production-style
      shopping experience using the MERN stack (MongoDB, Express.js, React.js and Node.js).
    </p>

    <section className="section">
      <h2>Our Story</h2>
      <p>
        This store was developed as part of an MCA (Master of Computer Applications) final-year
        project titled <em>&ldquo;Design and Development of an E-Commerce Website Using the MERN
        Stack.&rdquo;</em> It brings together a React + Vite frontend, a Node.js/Express REST API,
        and a MongoDB database to show how browsing, carts, checkout, payments and admin management
        work together in a real full-stack application.
      </p>
    </section>

    <section className="section">
      <h2>What We Offer</h2>
      <div className="feature-grid">
        <div className="feature-card">
          <ShieldCheck size={24} aria-hidden="true" />
          <h3>Secure Shopping</h3>
          <p>Authentication, authorization and server-side validation protect every order.</p>
        </div>
        <div className="feature-card">
          <Truck size={24} aria-hidden="true" />
          <h3>Flexible Delivery</h3>
          <p>Pay with Cash on Delivery or online via Razorpay — whichever suits you.</p>
        </div>
        <div className="feature-card">
          <Headphones size={24} aria-hidden="true" />
          <h3>Responsive Support</h3>
          <p>Questions about an order or product? Reach out on our Contact page any time.</p>
        </div>
        <div className="feature-card">
          <Award size={24} aria-hidden="true" />
          <h3>Quality Catalogue</h3>
          <p>Electronics, clothing, books, home essentials and accessories, all in one place.</p>
        </div>
      </div>
    </section>

    <section className="section">
      <h2>Get in Touch</h2>
      <p>
        Have a question about an order, a product, or this project itself? Visit our{' '}
        <Link to="/contact">Contact page</Link> and send us a message.
      </p>
    </section>
  </div>
);

export default AboutUs;
