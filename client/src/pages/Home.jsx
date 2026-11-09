// import React, { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { fetchProducts } from '../services/productService.js';
// import { fetchCategories } from '../services/categoryService.js';
// import { useCart } from '../context/CartContext.jsx';
// import { useAuth } from '../context/AuthContext.jsx';
// import ProductGrid from '../components/ProductGrid.jsx';
// import LoadingSpinner from '../components/LoadingSpinner.jsx';
// import ErrorMessage from '../components/ErrorMessage.jsx';
// import heroimg from '/src/assets/Banner_image.png'

// const Home = () => {
//   const [featured, setFeatured] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [addingId, setAddingId] = useState(null);
//   const [toast, setToast] = useState('');
//   const { isAuthenticated } = useAuth();
//   const { addItem } = useCart();

//   const load = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [productData, categoryData] = await Promise.all([
//         fetchProducts({ limit: 8, sort: 'newest' }),
//         fetchCategories(),
//       ]);
//       setFeatured(productData.products);
//       setCategories(categoryData);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const handleAddToCart = async (product) => {
//     if (!isAuthenticated) {
//       setToast('Please log in to add items to your cart.');
//       return;
//     }
//     setAddingId(product._id);
//     const res = await addItem(product._id, 1);
//     setAddingId(null);
//     setToast(res.success ? `${product.name} added to cart` : res.message);
//     setTimeout(() => setToast(''), 2500);
//   };

//   return (
//     <div className="home-page">
//       {toast && <div className="toast">{toast}</div>}

//       <section className="hero">
//         <div className="hero-content">
//           <img src={heroimg} alt="heriImage" className="hero-image" />
//           <div className="hero-text-block">
//             <h1>Your choices define our collection.</h1>
//             <p>We bring your favourite brands and everyday essentials right to your doorstep</p>
//           </div>
//           <Link to="/products" className="btn btn-primary btn-lg">
//             Shop Now
//           </Link>
//         </div>
//       </section>

//       <section className="section">
//         <h2>Shop by Category</h2>
//         {loading ? (
//           <LoadingSpinner />
//         ) : (
//           <div className="category-chip-row">
//             {categories.map((cat) => (
//               <Link key={cat._id} to={`/products?category=${cat._id}`} className="category-chip">
//                 {cat.name}
//               </Link>
//             ))}
//           </div>
//         )}
//       </section>

//       <section className="section">
//         <h2>Featured Products</h2>
//         {loading && <LoadingSpinner />}
//         {error && <ErrorMessage message={error} onRetry={load} />}
//         {!loading && !error && (
//           <ProductGrid products={featured} onAddToCart={handleAddToCart} addingId={addingId} />
//         )}
//       </section>
//     </div>
//   );
// };

// export default Home;


import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { fetchProducts } from '../services/productService.js';
import { fetchCategories } from '../services/categoryService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

import heroimg1 from '/src/assets/Banner_image.png';
import heroimg2 from '/src/assets/Banner_image_2.png';
import heroimg3 from '/src/assets/Banner_image_3.png';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const slides = [
    {
      id: 1,
      image: heroimg1,
      eyebrow: 'WELCOME TO ApnaCart',
      title: 'Your choices define our collection.',
      description:
        'Discover your favourite brands, trending products and everyday essentials delivered right to your doorstep.',
      button: 'Shop Now',
      link: '/products',
    },
    {
      id: 2,
      image: heroimg2,
      eyebrow: 'NEW COLLECTION',
      title: 'Fresh styles. Better choices.',
      description:
        'Explore our latest collection and find products selected to make your everyday shopping easier.',
      button: 'Shop Now',
      link: '/products',
    },
    {
      id: 3,
      image: heroimg3,
      eyebrow: 'SHOP SMART',
      title: 'Everything you need, in one place.',
      description:
        'Browse categories, compare products and build your perfect cart with ApnaCart.',
      button: 'Shop Now',
      link: '/products',
    },
  ];

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const [productData, categoryData] = await Promise.all([
        fetchProducts({
          limit: 8,
          sort: 'newest',
        }),
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

  /*
   * Automatic hero slider
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      setToast('Please log in to add items to your cart.');

      setTimeout(() => {
        setToast('');
      }, 2500);

      return;
    }

    setAddingId(product._id);

    const res = await addItem(product._id, 1);

    setAddingId(null);

    setToast(
      res.success
        ? `${product.name} added to cart`
        : res.message
    );

    setTimeout(() => {
      setToast('');
    }, 2500);
  };

  return (
    <div className="home-page">
      {toast && (
        <div className="toast home-toast">
          <ShoppingBag size={18} />
          <span>{toast}</span>
        </div>
      )}


      <section className="home-hero">

        <div className="hero-slider">

          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-slide ${index === currentSlide ? 'active' : ''
                }`}
            >

              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="hero-slide-image"
              />

              {/* Dark Overlay */}
              <div className="hero-overlay"></div>

              {/* Content */}
              <div className="hero-slide-content">

                <span className="hero-eyebrow">
                  {slide.eyebrow}
                </span>

                <h1>{slide.title}</h1>

                <p>{slide.description}</p>

                <Link
                  to={slide.link}
                  className="btn btn-primary btn-lg hero-shop-button"
                >
                  {slide.button}
                  <ArrowRight size={19} />
                </Link>

              </div>
            </div>
          ))}

          {/* Previous Button */}
          <button
            type="button"
            className="hero-arrow hero-arrow-left"
            onClick={previousSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft size={25} />
          </button>

          {/* Next Button */}
          <button
            type="button"
            className="hero-arrow hero-arrow-right"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight size={25} />
          </button>

          {/* Slider Dots */}
          <div className="hero-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`hero-dot ${index === currentSlide ? 'active' : ''
                  }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

        </div>

      </section>

      {/* =========================
          Category Section
      ========================== */}
      <section className="section home-section">

        <div className="section-heading">
          <div>
            <h2>Shop by Category</h2>

            <p>
              Find exactly what you need from our collection.
            </p>
          </div>

          <Link
            to="/products"
            className="section-view-link"
          >
            View All
            <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="category-chip-row home-category-row">

            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat._id}`}
                className="category-chip home-category-chip"
              >
                {cat.name}

                <ArrowRight size={15} />
              </Link>
            ))}

          </div>
        )}

      </section>

      {/* =========================
          Featured Products
      ========================== */}
      <section className="section home-section">

        <div className="section-heading">
          <div>
            <h2>Featured Products</h2>

            <p>
              Discover some of our newest and most popular products.
            </p>
          </div>

          <Link
            to="/products"
            className="section-view-link"
          >
            View All
            <ArrowRight size={17} />
          </Link>
        </div>

        {loading && <LoadingSpinner />}

        {error && (
          <ErrorMessage
            message={error}
            onRetry={load}
          />
        )}

        {!loading && !error && (
          <ProductGrid
            products={featured}
            onAddToCart={handleAddToCart}
            addingId={addingId}
          />
        )}

      </section>

      {/* =========================
          Bottom CTA
      ========================== */}
      <section className="home-cta">

        <div className="home-cta-content">

          <span className="section-label">
            SHOP WITH APNACART
          </span>

          <h2>
            Ready to find your next favourite product?
          </h2>

          <p>
            Browse our complete collection and start shopping today.
          </p>

          <Link
            to="/products"
            className="btn btn-primary btn-lg"
          >
            Explore Products
            <ArrowRight size={19} />
          </Link>

        </div>

      </section>

    </div>
  );
};

export default Home;