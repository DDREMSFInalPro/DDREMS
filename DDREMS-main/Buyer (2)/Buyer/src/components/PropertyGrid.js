import React from 'react';
import PropertyCard from './PropertyCard';
import './PropertyGrid.css';

function PropertyGrid({ properties, savedProperties, onViewProperty, onToggleSave, onOpenInquiry }) {
  return (
    <div>
      <div className="properties-header">
        <h2>Available Properties ({properties.length})</h2>
      </div>
      <div className="properties-grid">
        {properties.map(property => (
          <PropertyCard
            key={property.id}
            property={property}
            isSaved={savedProperties.includes(property.id)}
            onView={() => onViewProperty(property)}
            onToggleSave={() => onToggleSave(property.id)}
            onInquire={() => onOpenInquiry(property.id)}
          />
        ))}
      </div>
      {properties.length === 0 && (
        <div className="no-results">
          <p>😔 No properties found matching your criteria</p>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

export default PropertyGrid;
