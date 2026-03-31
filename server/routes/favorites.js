const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get user favorites
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, properties(title, location, price, type, property_images(image_url, image_type))')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(f => ({
      ...f,
      property_title: f.properties?.title,
      property_location: f.properties?.location,
      property_price: f.properties?.price,
      property_type: f.properties?.type,
      main_image: f.properties?.property_images?.find(i => i.image_type === 'main')?.image_url || null,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to favorites
router.post('/', async (req, res) => {
  try {
    const { user_id, property_id } = req.body;
    const { error } = await supabase.from('favorites').insert({ user_id, property_id });
    if (error) throw error;
    res.status(201).json({ message: 'Added to favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from favorites
router.delete('/:userId/:propertyId', async (req, res) => {
  try {
    const { error } = await supabase.from('favorites').delete().eq('user_id', req.params.userId).eq('property_id', req.params.propertyId);
    if (error) throw error;
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
