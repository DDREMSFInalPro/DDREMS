/**
 * AI Price Recommendation Service
 * Calls the external AI microservice for property price suggestions
 * Falls back to a simple rule-based calculation if the service is unavailable
 */
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/predict-price';

/**
 * Get AI-recommended price for a property
 * @param {Object} params - Property attributes for price prediction
 * @param {string} params.propertyType - Type of property
 * @param {string} params.listingType - sale or rent
 * @param {number} params.sizeSqm - Size in square meters
 * @param {number} params.bedrooms - Number of bedrooms
 * @param {number} params.bathrooms - Number of bathrooms
 * @param {string} params.city - City name
 * @param {string} params.address - Property address
 * @returns {Object} - { recommendedPrice, confidence, source }
 */
const getPriceRecommendation = async (params) => {
  try {
    // Attempt to call external AI service
    const response = await axios.post(AI_SERVICE_URL, {
      property_type: params.propertyType,
      listing_type: params.listingType,
      size_sqm: params.sizeSqm,
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      city: params.city,
      address: params.address,
    }, {
      timeout: 10000, // 10 second timeout
    });

    return {
      recommendedPrice: response.data.predicted_price || response.data.price,
      confidence: response.data.confidence || 0.85,
      source: 'ai_model',
      details: response.data.details || null,
    };
  } catch (error) {
    console.warn('AI service unavailable, using fallback calculation:', error.message);

    // Fallback: simple rule-based price estimation
    return getFallbackPrice(params);
  }
};

/**
 * Fallback rule-based price calculation
 * Used when the AI microservice is unavailable
 */
const getFallbackPrice = (params) => {
  // Base prices per sqm by property type (in ETB - Ethiopian Birr)
  const basePricePerSqm = {
    apartment: 15000,
    house: 12000,
    villa: 25000,
    commercial: 18000,
    land: 8000,
    office: 20000,
  };

  const basePrice = basePricePerSqm[params.propertyType] || 12000;
  let estimatedPrice = basePrice * (params.sizeSqm || 100);

  // Adjust for bedrooms and bathrooms
  estimatedPrice += (params.bedrooms || 0) * 50000;
  estimatedPrice += (params.bathrooms || 0) * 30000;

  // For rental, assume monthly rent is ~0.5% of property value
  if (params.listingType === 'rent') {
    estimatedPrice = estimatedPrice * 0.005;
  }

  return {
    recommendedPrice: Math.round(estimatedPrice),
    confidence: 0.6,
    source: 'rule_based_fallback',
    details: 'AI service unavailable. Price estimated using rule-based calculation.',
  };
};

module.exports = { getPriceRecommendation };
