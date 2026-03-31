const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get images for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('property_images').select('*').eq('property_id', req.params.propertyId).order('image_type').order('created_at');
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload property image
router.post('/', async (req, res) => {
  try {
    const { property_id, image_url, image_type, uploaded_by } = req.body;
    if (!property_id || !image_url) return res.status(400).json({ message: 'Property ID and image URL are required' });

    const { data, error } = await supabase.from('property_images')
      .insert({ property_id, image_url, image_type: image_type || 'gallery', uploaded_by })
      .select('id').single();
    if (error) throw error;

    if (image_type === 'main') {
      await supabase.from('properties').update({ main_image: image_url }).eq('id', property_id);
    } else {
      const { data: prop } = await supabase.from('properties').select('main_image').eq('id', property_id).single();
      if (prop && !prop.main_image) {
        await supabase.from('properties').update({ main_image: image_url }).eq('id', property_id);
      }
    }

    res.json({ id: data.id, message: 'Image uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete property image
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('property_images').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
