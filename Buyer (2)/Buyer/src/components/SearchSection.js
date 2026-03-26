import React, { useState } from 'react';
import './SearchSection.css';
import House3D from './House3D';

function SearchSection({ onSearch }) {
  const [filters, setFilters] = useState({
    type: 'all',
    location: 'all',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'all',
    sort: 'default'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  return (
    <div className="search-section">
      <House3D />
      <h2>🔍 Find Your Perfect Property</h2>
      <div className="search-filters">
        <div className="filter-group">
          <label>Property Type</label>
          <select name="type" value={filters.type} onChange={handleChange}>
            <option value="all">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="house">House</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Location</label>
          <select name="location" value={filters.location} onChange={handleChange}>
            <option value="all">All Locations</option>
            <option value="kezira">Kezira</option>
            <option value="sabian">Sabian</option>
            <option value="dechatu">Dechatu</option>
            <option value="legehare">Legehare</option>
            <option value="downtown">Downtown</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Min Price (ETB)</label>
          <input 
            type="number" 
            name="minPrice" 
            value={filters.minPrice} 
            onChange={handleChange}
            placeholder="Min Price" 
          />
        </div>
        <div className="filter-group">
          <label>Max Price (ETB)</label>
          <input 
            type="number" 
            name="maxPrice" 
            value={filters.maxPrice} 
            onChange={handleChange}
            placeholder="Max Price" 
          />
        </div>
        <div className="filter-group">
          <label>Bedrooms</label>
          <select name="bedrooms" value={filters.bedrooms} onChange={handleChange}>
            <option value="all">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort By</label>
          <select name="sort" value={filters.sort} onChange={handleChange}>
            <option value="default">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>
      <button className="search-btn" onClick={handleSearch}>
        🔍 Search Properties
      </button>
    </div>
  );
}

export default SearchSection;
