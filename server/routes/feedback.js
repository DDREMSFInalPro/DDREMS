const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get feedback for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, users(name)')
      .eq('property_id', req.params.propertyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(f => ({ ...f, user_name: f.users?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const { user_id, property_id, rating, comment } = req.body;
    const { data, error } = await supabase.from('feedback').insert({ user_id, property_id, rating, comment }).select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id, message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
