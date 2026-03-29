const axios = require('axios');
const { getPriceRecommendation, getPriceVerdict } = require('../services/aiService');
const { Property } = require('../models');

const KNN_SERVICE = process.env.KNN_SERVICE_URL || 'http://127.0.0.1:8001';

// City name mapping for Flask dataset
const CITY_MAP = {
  'Dire Dawa':   'DireDawa',
  'Addis Ababa': 'AddisAbaba',
  'Bahir Dar':   'BahirDar',
  'Hawassa':     'Hawassa',
  'Adama':       'Adama',
  'DireDawa':    'DireDawa',
  'AddisAbaba':  'AddisAbaba',
  'BahirDar':    'BahirDar',
};

/**
 * POST /api/ai/recommend
 * AI price recommendation + deal verdict (used by AIPricePage)
 */
const getRecommendation = async (req, res, next) => {
  try {
    const { propertyType, listingType, sizeSqm, bedrooms, bathrooms, city, listedPrice } = req.body;

    if (!propertyType || !listingType) {
      return res.status(400).json({ success: false, message: 'propertyType and listingType are required.' });
    }

    const result = await getPriceRecommendation({
      propertyType, listingType,
      sizeSqm:    parseFloat(sizeSqm)    || 80,
      bedrooms:   parseInt(bedrooms)     || 0,
      bathrooms:  parseInt(bathrooms)    || 0,
      city:       city || 'DireDawa',
      listedPrice: listedPrice ? parseFloat(listedPrice) : null,
    });

    let verdict = null;
    if (listedPrice) {
      verdict = getPriceVerdict(parseFloat(listedPrice), result.recommendedPrice, listingType);
    }

    // Similar properties from DB
    const similar = await Property.findAll({
      where: { propertyType, listingType, isPublished: true },
      attributes: ['id', 'title', 'price', 'sizeSqm', 'bedrooms', 'address'],
      limit: 4,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: {
        recommendedPrice: result.recommendedPrice,
        confidence:       result.confidence,
        source:           result.source,
        details:          result.details,
        verdict,
        similarProperties: similar,
        aiRecommendations: result.recommendations || [],
        inputs: { propertyType, listingType, sizeSqm, bedrooms, bathrooms, city },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/properties
 * Proxy to Flask /recommend — returns raw property recommendations
 * Used by the Recommendations component (avoids direct browser→Flask call)
 */
const getPropertyRecommendations = async (req, res, next) => {
  try {
    const { price, bedrooms, location } = req.body;

    if (price == null || bedrooms == null || !location) {
      return res.status(400).json({ success: false, message: 'price, bedrooms, and location are required.' });
    }

    const flaskLocation = CITY_MAP[location] || location;

    const flaskRes = await axios.post(FLASK_RECOMMEND_URL, {
      price:    parseFloat(price),
      bedrooms: parseInt(bedrooms),
      location: flaskLocation,
    }, { timeout: 8000 });

    res.json({ success: true, data: flaskRes.data });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data?.error || 'Flask AI service error.',
      });
    }
    // Flask not running — return empty gracefully
    res.json({ success: true, data: [] });
  }
};

/**
 * GET /api/ai/recommend/:propertyId
 * AI verdict for a specific listed property
 */
const getPropertyVerdict = async (req, res, next) => {
  try {
    const property = await Property.findByPk(req.params.propertyId, {
      attributes: ['id', 'title', 'price', 'propertyType', 'listingType', 'sizeSqm', 'bedrooms', 'bathrooms', 'city', 'address'],
    });

    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

    const result = await getPriceRecommendation({
      propertyType: property.propertyType,
      listingType:  property.listingType,
      sizeSqm:      property.sizeSqm,
      bedrooms:     property.bedrooms,
      bathrooms:    property.bathrooms,
      city:         property.city,
    });

    const verdict = getPriceVerdict(parseFloat(property.price), result.recommendedPrice, property.listingType);

    res.json({
      success: true,
      data: {
        property: { id: property.id, title: property.title, listedPrice: property.price },
        recommendedPrice: result.recommendedPrice,
        confidence:       result.confidence,
        source:           result.source,
        verdict,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/ai/knn-recommend
 * Proxy to Flask KNN service
 */
const knnRecommend = async (req, res, next) => {
  try {
    const { price, bedrooms, location } = req.body;
    if (!price || !bedrooms || !location) {
      return res.status(400).json({ success: false, message: 'price, bedrooms and location are required.' });
    }
    const flaskRes = await axios.post(`${KNN_SERVICE}/recommend`, { price, bedrooms, location }, { timeout: 8000 });
    res.json(flaskRes.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return res.status(503).json({ success: false, message: 'AI recommendation service is offline. Please start the Flask server.' });
    }
    next(err);
  }
};

module.exports = { getRecommendation, getPropertyRecommendations, getPropertyVerdict, knnRecommend };
