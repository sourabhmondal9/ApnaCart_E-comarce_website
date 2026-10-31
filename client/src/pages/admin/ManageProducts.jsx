import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { fetchProducts, deleteProduct } from '../../services/productService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts({ includeInactive: 'true', limit: 50 });
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteProduct(id);
      setConfirmId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Manage Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          <Plus size={16} aria-hidden="true" /> Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="empty-state">No products yet. Add your first product or run the seed script.</p>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.category?.name || '—'}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-table-actions">
                    <Link to={`/admin/products/${p._id}/edit`} className="btn btn-icon" aria-label={`Edit ${p.name}`}>
                      <Pencil size={16} />
                    </Link>
                    {confirmId === p._id ? (
                      <span className="confirm-inline">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={busyId === p._id}
                          onClick={() => handleDelete(p._id)}
                        >
                          {busyId === p._id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-icon-danger"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => setConfirmId(p._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
