const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Record a property view
router.post('/', async (req, res) => {
  try {
    const { user_id, property_id } = req.body;
    const { error } = await supabase.from('property_views').insert({ user_id, property_id });
    if (error) throw error;
    res.json({ message: 'View recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent views for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('property_views')
      .select('*, properties(title, location, price, property_images(image_url))')
      .eq('user_id', req.params.userId)
      .order('viewed_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    res.json((data || []).map(v => ({
      ...v,
      property_title: v.properties?.title,
      property_location: v.properties?.location,
      property_price: v.properties?.price,
      main_image: v.properties?.property_images?.[0]?.image_url || null,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get most viewed properties (recommendations)
router.get('/recommendations', async (req, res) => {
  try {
    const { data, error } = await supabase.from('properties')
      .select('*, property_views(id), property_images(image_url)')
      .eq('status', 'active')
      .order('views', { ascending: false })
      .limit(8);
    if (error) throw error;
    res.json((data || []).map(p => ({
      ...p,
      view_count: p.property_views?.length || 0,
      main_image: p.property_images?.[0]?.image_url || null,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
