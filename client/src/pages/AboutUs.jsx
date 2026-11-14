import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Headphones, Award } from 'lucide-react';

const AboutUs = () => (
  <div className="static-page">
    <h1>About ApnaCart</h1>
    <p className="static-page-lead static-page-tagline">Apni Pasand. Apni Shopping.</p>
    <p className="static-page-lead">
      ApnaCart — Apni Pasand. Apni Shoping. 
      ApnaCart is your everyday online shopping destination. 
      We bring you quality products, honest prices, and a shopping experience that is simple, fast, and made for India. 
      From daily essentials to the latest trends, we make it easy to find what you love, order in a few taps, 
      and get it delivered to your doorstep — without any hassle.
    </p>

    <section className="section">
      <h2>Our Story</h2>
      <p>
        ApnaCart started with one simple idea: online shopping should feel like shopping from your own neighbourhood store — 
         <em>&ldquo;familiar, trustworthy, and personal.We saw that big platforms had become complicated, slow, and impersonal.&rdquo;</em>  
         So we built ApnaCart to be different. A store where you can browse easily, pay securely, and always know where your order is. 
        Today, ApnaCart is growing every day with happy customers who trust us for quality, transparency, and great service.
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
