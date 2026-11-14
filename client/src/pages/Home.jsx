import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../services/productService.js';
import { fetchCategories } from '../services/categoryService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const heroSlides = [
  {
    id: 1,
    eyebrow: 'New Collection • 2026',
    title: 'Everything you need, delivered to your door',
    description:
      'Browse electronics, clothing, books, home essentials and accessories — all in one place.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    className: 'hero-slide-1',
  },
  {
    id: 2,
    eyebrow: 'Handpicked For You',
    title: 'Discover products you will love',
    description:
      'Explore our latest collection and find quality products at great prices.',
    buttonText: 'Explore Products',
    buttonLink: '/products',
    className: 'hero-slide-2',
  },
  {
    id: 3,
    eyebrow: 'Best Value • Top Rated',
    title: 'Great deals. Great products. One place.',
    description:
      'Find amazing products across multiple categories and enjoy a simple shopping experience.',
    buttonText: 'Start Shopping',
    buttonLink: '/products',
    className: 'hero-slide-3',
  },
];

// Simple emoji/icon map - you can replace with real icons later
const categoryIcons = ['📚', '👕', '💻', '👟', '🏠', '💍', '🎧', '💄', '🧸', '⚽'];

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productData, categoryData] = await Promise.all([
        fetchProducts({ limit: 8, sort: 'newest' }),
        fetchCategories(),
      ]);
      setFeatured(productData.products);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Automatic hero slider
  useEffect(() => {
    if (isHeroHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHeroHovered]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const previousSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const goToSlide = (index) => setCurrentSlide(index);

  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 2600);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      showToast('Please log in to add items to your cart.', 'error');
      return;
    }
    setAddingId(product._id);
    const res = await addItem(product._id, 1);
    setAddingId(null);
    showToast(
      res.success ? `${product.name} added to cart` : res.message,
      res.success ? 'success' : 'error'
    );
  };

  return (
    <div className="home-page">
      {toast && (
        <div className={`toast ${toastType === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toastType === 'success' ? '✓ ' : '• '}
          {toast}
        </div>
      )}

      {/* ========================= HERO CAROUSEL ========================== */}
      <section
        className="hero"
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
      >
        <div
          className="hero-slider"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroSlides.map((slide) => (
            <div key={slide.id} className={`hero-slide ${slide.className}`}>
              <div className="hero-content">
                <span className="hero-eyebrow">{slide.eyebrow}</span>
                <h1>{slide.title}</h1>
                <p>{slide.description}</p>
                <div className="hero-actions">
                  <Link to={slide.buttonLink} className="btn btn-primary btn-lg">
                    {slide.buttonText} →
                  </Link>
                  <Link to="/products?category=" className="btn btn-hero-secondary btn-lg">
                    Browse Categories
                  </Link>
                </div>
                <div className="hero-meta">
                  <span>⭐ 4.8 / 5 rating</span>
                  <span className="hero-meta-dot">•</span>
                  <span>10,000+ happy customers</span>
                  <span className="hero-meta-dot">•</span>
                  <span>Fast delivery</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="hero-arrow hero-arrow-left"
          onClick={previousSlide}
          aria-label="Previous slide"
        >
          ❮
        </button>
        <button
          type="button"
          className="hero-arrow hero-arrow-right"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          ❯
        </button>

        <div className="hero-dots">
          {heroSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`hero-dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={currentSlide === index}
            />
          ))}
        </div>
      </section>

      {/* ========================= TRUST STRIP ========================== */}
      <section className="trust-strip">
        <div className="trust-item">
          <span className="trust-icon">🚚</span>
          <div>
            <strong>Fast Delivery</strong>
            <span>Across India in 2-5 days</span>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">🛡️</span>
          <div>
            <strong>Secure Payment</strong>
            <span>100% safe & protected</span>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">↩️</span>
          <div>
            <strong>Easy Returns</strong>
            <span>7-day hassle-free returns</span>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">💬</span>
          <div>
            <strong>24/7 Support</strong>
            <span>We are here to help</span>
          </div>
        </div>
      </section>

      {/* ========================= CATEGORIES ========================== */}
      <section className="section">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Categories</span>
            <h2>Shop by Category</h2>
            <p className="section-subtitle">Find exactly what you're looking for</p>
          </div>
          <Link to="/products" className="section-link">
            View all →
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : categories.length === 0 ? (
          <p className="empty-text">No categories found.</p>
        ) : (
          <div className="category-card-grid">
            {categories.map((cat, i) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="category-card"
              >
                <div className="category-card-icon-div" >
                  <span className="category-card-icon">
                    {categoryIcons[i % categoryIcons.length]}
                  </span>
                  <span className="category-card-name">{cat.name}</span>
                </div>

                <span className="category-card-cta">Shop now →</span>

              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ========================= FEATURED PRODUCTS ========================== */}
      <section className="section">
        <div className="section-header">
          <div>
            <span className="section-eyebrow">Fresh & Trending</span>
            <h2>Featured Products</h2>
            <p className="section-subtitle">Handpicked new arrivals just for you</p>
          </div>
          <Link to="/products" className="section-link">
            View all products →
          </Link>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={load} />}

        {!loading && !error && featured.length === 0 && (
          <p className="empty-text">No featured products yet.</p>
        )}

        {!loading && !error && featured.length > 0 && (
          <ProductGrid
            products={featured}
            onAddToCart={handleAddToCart}
            addingId={addingId}
            onWishlistMessage={(msg) => showToast(msg)}
          />
        )}
      </section>

      {/* ========================= CTA BANNER ========================== */}
      <section className="cta-banner">
        <div>
          <h2>Can't find what you're looking for?</h2>
          <p>Browse our full collection across all categories.</p>
        </div>
        <Link to="/products" className="btn btn-primary btn-lg">
          Browse All Products →
        </Link>
      </section>
    </div>
  );
};

export default Home;