import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ initialValue = '', onSearch, placeholder = 'Search products...' }) => {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
      />
      <button type="submit" className="btn btn-primary btn-sm">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
