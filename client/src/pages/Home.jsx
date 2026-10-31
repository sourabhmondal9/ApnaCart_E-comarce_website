import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../services/productService.js';
import { fetchCategories } from '../services/categoryService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState('');
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

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      setToast('Please log in to add items to your cart.');
      return;
    }
    setAddingId(product._id);
    const res = await addItem(product._id, 1);
    setAddingId(null);
    setToast(res.success ? `${product.name} added to cart` : res.message);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="home-page">
      {toast && <div className="toast">{toast}</div>}

      <section className="hero">
        <div className="hero-content">
          <h1>Everything you need, delivered to your door</h1>
          <p>Browse electronics, clothing, books, home essentials and accessories — all in one place.</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Shop Now
          </Link>
        </div>
      </section>

      <section className="section">
        <h2>Shop by Category</h2>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="category-chip-row">
            {categories.map((cat) => (
              <Link key={cat._id} to={`/products?category=${cat._id}`} className="category-chip">
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Featured Products</h2>
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={load} />}
        {!loading && !error && (
          <ProductGrid products={featured} onAddToCart={handleAddToCart} addingId={addingId} />
        )}
      </section>
    </div>
  );
};

export default Home;
