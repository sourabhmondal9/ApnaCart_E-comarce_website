import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductById, createProduct, updateProduct } from '../../services/productService.js';
import { fetchCategories } from '../../services/categoryService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const emptyForm = { name: '', description: '', price: '', stock: '', imageUrl: '', category: '', isActive: true };

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // flat=true: a single list (not the nested tree) is what a <select> needs
        const cats = await fetchCategories({ includeInactive: 'true', flat: 'true' });
        setCategories(cats);

        if (isEdit) {
          const product = await fetchProductById(id);
          setForm({
            name: product.name,
            description: product.description,
            price: String(product.price),
            stock: String(product.stock),
            imageUrl: product.imageUrl || '',
            category: product.category?._id || '',
            isActive: product.isActive,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        imageUrl: form.imageUrl.trim(),
        category: form.category,
        isActive: form.isActive,
      };
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.details ? err.details.join(', ') : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        {error && <p className="form-error">{error}</p>}

        <label htmlFor="name">Product name</label>
        <input id="name" name="name" value={form.name} onChange={handleChange} required />

        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={4} value={form.description} onChange={handleChange} required />

        <div className="form-row">
          <div>
            <label htmlFor="price">Price (INR)</label>
            <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="stock">Stock</label>
            <input id="stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} required />
          </div>
        </div>

        <label htmlFor="category">Category</label>
        <select id="category" name="category" value={form.category} onChange={handleChange} required>
          <option value="">Select a category</option>
          {categories
            .filter((c) => !c.parentCategory)
            .map((parent) => (
              <React.Fragment key={parent._id}>
                <option value={parent._id}>{parent.name}</option>
                {categories
                  .filter((c) => c.parentCategory === parent._id)
                  .map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
                    </option>
                  ))}
              </React.Fragment>
            ))}
        </select>

        <label htmlFor="imageUrl">Image URL</label>
        <input id="imageUrl" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." />

        {isEdit && (
          <label className="checkbox-label">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            Active (visible to customers)
          </label>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/products')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
