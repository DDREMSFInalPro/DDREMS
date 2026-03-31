const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, properties(title), users(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(t => ({ ...t, property_title: t.properties?.title, user_name: t.users?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
