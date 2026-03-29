const axios = require('axios');

// Flask AI service running on port 5000
const FLASK_RECOMMEND_URL = process.env.FLASK_AI_URL || 'http://localhost:5000/recommend';

// City name mapping: Node DB values → Flask dataset values
const CITY_MAP = {
  'Dire Dawa':   'DireDawa',
  'Addis Ababa': 'AddisAbaba',
  'Bahir Dar':   'BahirDar',
  'Hawassa':     'Hawassa',
  'Adama':       'Adama',
  // pass-through if already in dataset format
  'DireDawa':    'DireDawa',
  'AddisAbaba':  'AddisAbaba',
  'BahirDar':    'BahirDar',
};

const getPriceRecommendation = async (params) => {
  try {
    const location = CITY_MAP[params.city] || params.city;
    const response = await axios.post(FLASK_RECOMMEND_URL, {
      price:    params.listedPrice || params.sizeSqm * 15000 || 2000000,
      bedrooms: params.bedrooms,
      location,
    }, { timeout: 8000 });

    // Flask returns an array of recommended properties
    const recs = response.data;
    const avgPrice = recs.length
      ? recs.reduce((sum, r) => sum + r.price, 0) / recs.length
      : null;

    return {
      recommendedPrice: avgPrice ? Math.round(avgPrice) : getFallbackPrice(params).recommendedPrice,
      confidence: 0.85,
      source: 'ai_model',
      recommendations: recs,
    };
  } catch {
    return getFallbackPrice(params);
  }
};

const getFallbackPrice = (params) => {
  const basePricePerSqm = {
    apartment: 15000, house: 12000, villa: 25000,
    commercial: 18000, land: 8000, office: 20000,
  };
  const base = basePricePerSqm[params.propertyType] || 12000;
  let price = base * (params.sizeSqm || 80);
  price += (params.bedrooms || 0) * 50000;
  price += (params.bathrooms || 0) * 30000;

  // Location multiplier — keys match both DB and dataset formats
  const locationMultiplier = {
    'DireDawa': 1.0, 'Dire Dawa': 1.0,
    'AddisAbaba': 1.8, 'Addis Ababa': 1.8,
    'BahirDar': 0.9, 'Bahir Dar': 0.9,
    'Hawassa': 0.85,
    'Adama': 0.8,
  };
  price *= locationMultiplier[params.city] || 1.0;

  if (params.listingType === 'rent') price = price * 0.005;

  return {
    recommendedPrice: Math.round(price),
    confidence: 0.72,
    source: 'rule_based',
    details: 'Estimated using market-based rules for Dire Dawa region.',
  };
};

// Generate verdict: is the listed price fair?
const getPriceVerdict = (listedPrice, recommendedPrice, listingType) => {
  const diff = ((listedPrice - recommendedPrice) / recommendedPrice) * 100;
  if (diff < -15) return { verdict: 'great_deal', label: '🔥 Great Deal', color: '#10b981', message: `Listed ${Math.abs(diff.toFixed(1))}% below market — excellent value!` };
  if (diff < -5)  return { verdict: 'good_deal',  label: '✅ Good Deal',  color: '#22c55e', message: `Listed ${Math.abs(diff.toFixed(1))}% below market — good value.` };
  if (diff < 5)   return { verdict: 'fair_price', label: '⚖️ Fair Price', color: '#f59e0b', message: 'Listed at market rate — fair price.' };
  if (diff < 15)  return { verdict: 'slightly_high', label: '⚠️ Slightly High', color: '#f97316', message: `Listed ${diff.toFixed(1)}% above market — consider negotiating.` };
  return { verdict: 'overpriced', label: '❌ Overpriced', color: '#ef4444', message: `Listed ${diff.toFixed(1)}% above market — significantly overpriced.` };
};

module.exports = { getPriceRecommendation, getPriceVerdict };
