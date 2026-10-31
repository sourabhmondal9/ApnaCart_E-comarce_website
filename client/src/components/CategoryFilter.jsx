import React from 'react';

const CategoryFilter = ({ categories, selected, onChange }) => (
  <div className="category-filter">
    <label htmlFor="category-select">Category</label>
    <select id="category-select" value={selected || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat._id} value={cat._id}>
          {cat.name}
        </option>
      ))}
    </select>
  </div>
);

export default CategoryFilter;
