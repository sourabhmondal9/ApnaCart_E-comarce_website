import React, { useEffect, useState } from 'react';
import { Trash2, Pencil, Plus, X, CornerDownRight } from 'lucide-react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const emptyForm = { name: '', description: '', parentCategory: '' };

const ManageCategories = () => {
  const [categories, setCategories] = useState([]); // flat list, used for the table + parent dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // category being edited, or null for "new"
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories({ includeInactive: 'true', flat: 'true' });
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const topLevelCategories = categories.filter((c) => !c.parentCategory);
  // Only top-level categories can be chosen as a parent (one level of nesting only)
  const parentOptions = topLevelCategories.filter((c) => !editing || c._id !== editing._id);

  const childrenOf = (parentId) => categories.filter((c) => c.parentCategory === parentId);

  const openNew = (parentId = '') => {
    setEditing(null);
    setForm({ ...emptyForm, parentCategory: parentId });
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', parentCategory: cat.parentCategory || '' });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        name: form.name,
        description: form.description,
        parentCategory: form.parentCategory || null,
      };
      if (editing) {
        await updateCategory(editing._id, payload);
      } else {
        await createCategory(payload);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.details ? err.details.join(', ') : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (cat) => {
    await updateCategory(cat._id, { isActive: !cat.isActive });
    await load();
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      setConfirmId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderRow = (c, isSub = false) => (
    <tr key={c._id}>
      <td>
        {isSub && <CornerDownRight size={14} aria-hidden="true" className="subcategory-icon" />}
        {c.name}
      </td>
      <td>{c.slug}</td>
      <td>{isSub ? 'Subcategory' : 'Top-level'}</td>
      <td>
        <button type="button" className={`badge-btn ${c.isActive ? 'badge-success' : 'badge-danger'}`} onClick={() => toggleActive(c)}>
          {c.isActive ? 'Active' : 'Inactive'}
        </button>
      </td>
      <td className="admin-table-actions">
        {!isSub && (
          <button
            type="button"
            className="btn btn-icon"
            aria-label={`Add subcategory under ${c.name}`}
            onClick={() => openNew(c._id)}
            title="Add subcategory"
          >
            <Plus size={16} />
          </button>
        )}
        <button type="button" className="btn btn-icon" aria-label={`Edit ${c.name}`} onClick={() => openEdit(c)}>
          <Pencil size={16} />
        </button>
        {confirmId === c._id ? (
          <span className="confirm-inline">
            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>
              Confirm
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmId(null)}>
              Cancel
            </button>
          </span>
        ) : (
          <button type="button" className="btn btn-icon-danger" aria-label={`Delete ${c.name}`} onClick={() => setConfirmId(c._id)}>
            <Trash2 size={16} />
          </button>
        )}
      </td>
    </tr>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div>
      <div className="admin-page-header">
        <h1>Manage Categories</h1>
        <button type="button" className="btn btn-primary" onClick={() => openNew()}>
          <Plus size={16} aria-hidden="true" /> Add Category
        </button>
      </div>

      {formOpen && (
        <form className="admin-form inline-form" onSubmit={handleSubmit}>
          <button type="button" className="btn btn-icon close-form-btn" onClick={() => setFormOpen(false)} aria-label="Close form">
            <X size={16} />
          </button>
          <h2>{editing ? 'Edit Category' : 'New Category'}</h2>
          {formError && <p className="form-error">{formError}</p>}

          <label htmlFor="cat-name">Name</label>
          <input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <label htmlFor="cat-desc">Description</label>
          <textarea id="cat-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <label htmlFor="cat-parent">Parent Category</label>
          <select
            id="cat-parent"
            value={form.parentCategory || ''}
            onChange={(e) => setForm({ ...form, parentCategory: e.target.value })}
          >
            <option value="">None (top-level category)</option>
            {parentOptions.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="field-note">Only one level of subcategories is supported.</p>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topLevelCategories.map((parent) => (
              <React.Fragment key={parent._id}>
                {renderRow(parent, false)}
                {childrenOf(parent._id).map((child) => renderRow(child, true))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <p className="empty-state">No categories yet.</p>}
      </div>
    </div>
  );
};

export default ManageCategories;
