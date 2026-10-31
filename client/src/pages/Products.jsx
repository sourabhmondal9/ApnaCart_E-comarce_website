import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../services/productService.js';
import { fetchCategories } from '../services/categoryService.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import SearchBar from '../components/SearchBar.jsx';
import CategoryFilter from '../components/CategoryFilter.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState('');
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({ search, category, sort, page, limit: 12 });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.set('page', '1'); // reset pagination on filter change
    setSearchParams(next);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      setToast('Please log in to add items to your cart.');
      setTimeout(() => setToast(''), 2500);
      return;
    }
    setAddingId(product._id);
    const res = await addItem(product._id, 1);
    setAddingId(null);
    setToast(res.success ? `${product.name} added to cart` : res.message);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="products-page">
      {toast && <div className="toast">{toast}</div>}
      <h1>All Products</h1>

      <div className="products-toolbar">
        <SearchBar initialValue={search} onSearch={(term) => updateParam('search', term)} />
        <CategoryFilter categories={categories} selected={category} onChange={(v) => updateParam('category', v)} />
        <div className="sort-filter">
          <label htmlFor="sort-select">Sort by</label>
          <select id="sort-select" value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && (
        <>
          <ProductGrid products={products} onAddToCart={handleAddToCart} addingId={addingId} />
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => updateParam('page', String(page + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
