import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Headphones, Award } from 'lucide-react';

const AboutUs = () => (
  <div className="static-page">
    <h1>About ApnaCart</h1>
    <p className="static-page-lead static-page-tagline">Apni Pasand. Apni Shopping.</p>
    <p className="static-page-lead">
      ApnaCart — Apni Pasand. Apni Shopping.
      ApnaCart is your everyday shopping destination — quality products, honest prices, and a shopping experience that feels simple, fast, and made just for you.
      From daily essentials to the latest trends, find what you love, order in a few taps, and get it delivered to your doorstep — without any hassle. 
      No hassle. No confusion. Bas apna style.
    </p>

    <section className="section">
      <h2>Our Story</h2>
      <p>
        Shopping That Feels Like Home.
        ApnaCart started with one simple idea — <em>&ldquo;online shopping should feel like shopping from your own neighbourhood store. 
        Familiar. Trustworthy. Personal&rdquo;</em>. Big platforms had become complicated. Slow, confusing, and impersonal. We thought, there has to be a better way.
        That’s why we built <em>&ldquo;ApnaCart&rdquo;</em>. A store where you can browse easily, pay securely, and know where your order is at every moment. <em>&ldquo;No hidden charges. No confusion&rdquo;</em>. 
        Just clean, straightforward shopping. Today, <em>&ldquo;ApnaCart&rdquo;</em> is growing every day — because people trust us. For quality. For transparency. And for service straight from the heart.
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
          <h3>24/7 Support</h3>
          <p>Questions about an order or product? Reach out on our Contact page at any time.</p>
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
        Have a question about an order, a product? Visit our{' '}
        <Link to="/contact">Contact page</Link> and send us a message.
      </p>
    </section>
  </div>
);

export default AboutUs;
