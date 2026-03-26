import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import SearchSection from './components/SearchSection';
import StatsSection from './components/StatsSection';
import AIRecommender from './components/AIRecommender';
import PropertyGrid from './components/PropertyGrid';
import PropertyModal from './components/PropertyModal';
import InquiryModal from './components/InquiryModal';
import SavedModal from './components/SavedModal';
import InquiriesModal from './components/InquiriesModal';
import PurchaseModal from './components/PurchaseModal';
import PurchaseSuccessModal from './components/PurchaseSuccessModal';
import { propertiesData } from './data/properties';

function App() {
  const [properties] = useState(propertiesData);
  const [filteredProperties, setFilteredProperties] = useState(propertiesData);
  const [savedProperties, setSavedProperties] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showInquiriesModal, setShowInquiriesModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentPropertyId, setCurrentPropertyId] = useState(null);
  const [currentPurchaseData, setCurrentPurchaseData] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSearch = (filters) => {
    let filtered = [...properties];

    if (filters.type !== 'all') {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    if (filters.location !== 'all') {
      filtered = filtered.filter(p => p.location === filters.location);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(filters.maxPrice));
    }

    if (filters.bedrooms !== 'all') {
      filtered = filtered.filter(p => p.bedrooms >= parseInt(filters.bedrooms));
    }

    if (filters.sort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'newest') {
      filtered.sort((a, b) => (b.yearBuilt || 0) - (a.yearBuilt || 0));
    }

    setFilteredProperties(filtered);
  };

  const handleViewProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertyModal(true);
  };

  const handleOpenInquiry = (propertyId) => {
    setCurrentPropertyId(propertyId);
    setShowInquiryModal(true);
    setShowPropertyModal(false);
  };

  const handleOpenPurchase = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    setShowPurchaseModal(true);
    setShowPropertyModal(false);
  };

  const handleSubmitInquiry = (inquiryData) => {
    const newInquiry = {
      id: Date.now(),
      propertyId: currentPropertyId,
      ...inquiryData,
      date: new Date().toLocaleDateString(),
      status: 'pending'
    };
    setInquiries([...inquiries, newInquiry]);
    setShowInquiryModal(false);
    showNotification('✅ Inquiry sent successfully! We will contact you soon.');
  };

  const handleCompletePurchase = (purchaseData) => {
    setPurchases([...purchases, purchaseData]);
    setCurrentPurchaseData(purchaseData);
    setShowPurchaseModal(false);
    setShowSuccessModal(true);
    showNotification('🎉 Purchase completed successfully!');
  };

  const handleToggleSave = (propertyId) => {
    if (savedProperties.includes(propertyId)) {
      setSavedProperties(savedProperties.filter(id => id !== propertyId));
      showNotification('Property removed from saved list');
    } else {
      setSavedProperties([...savedProperties, propertyId]);
      showNotification('❤️ Property saved successfully!');
    }
  };

  return (
    <div className="App">
      <Header 
        savedCount={savedProperties.length}
        onOpenSaved={() => setShowSavedModal(true)}
        onOpenInquiries={() => setShowInquiriesModal(true)}
      />
      
      <div className="container">
        <SearchSection onSearch={handleSearch} />
        <StatsSection totalProperties={filteredProperties.length} />
        <AIRecommender />
        <PropertyGrid 
          properties={filteredProperties}
          savedProperties={savedProperties}
          onViewProperty={handleViewProperty}
          onToggleSave={handleToggleSave}
          onOpenInquiry={handleOpenInquiry}
        />
      </div>

      {showPropertyModal && selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          isSaved={savedProperties.includes(selectedProperty.id)}
          onClose={() => setShowPropertyModal(false)}
          onToggleSave={handleToggleSave}
          onOpenInquiry={handleOpenInquiry}
          onOpenPurchase={handleOpenPurchase}
        />
      )}

      {showInquiryModal && (
        <InquiryModal
          propertyId={currentPropertyId}
          properties={properties}
          onClose={() => setShowInquiryModal(false)}
          onSubmit={handleSubmitInquiry}
        />
      )}

      {showSavedModal && (
        <SavedModal
          savedProperties={savedProperties}
          properties={properties}
          onClose={() => setShowSavedModal(false)}
          onViewProperty={handleViewProperty}
          onOpenInquiry={handleOpenInquiry}
        />
      )}

      {showInquiriesModal && (
        <InquiriesModal
          inquiries={inquiries}
          properties={properties}
          onClose={() => setShowInquiriesModal(false)}
        />
      )}

      {showPurchaseModal && selectedProperty && (
        <PurchaseModal
          property={selectedProperty}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handleCompletePurchase}
        />
      )}

      {showSuccessModal && currentPurchaseData && (
        <PurchaseSuccessModal
          purchaseData={currentPurchaseData}
          onClose={() => {
            setShowSuccessModal(false);
            setCurrentPurchaseData(null);
          }}
        />
      )}

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;
