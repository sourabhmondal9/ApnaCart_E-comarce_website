import React from 'react';

// `categories` is the tree-shaped response from GET /api/categories

const CategoryFilter = ({ categories, selected, onChange }) => (
  <div className="category-filter">
    <label htmlFor="category-select">Category</label>
    <select id="category-select" value={selected || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <React.Fragment key={cat._id}>
          <option value={cat._id}>{cat.name}</option>
          {(cat.subcategories || []).map((sub) => (
            <option key={sub._id} value={sub._id}>
              &nbsp;&nbsp;&nbsp;&nbsp;↳ {sub.name}
            </option>
          ))}
        </React.Fragment>
      ))}
    </select>
  </div>
);

export default CategoryFilter;
