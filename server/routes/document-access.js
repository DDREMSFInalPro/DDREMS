const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Request document access
router.post('/request', async (req, res) => {
  try {
    const { property_id, user_id } = req.body;
    const { data: existing } = await supabase.from('document_access').select('id').eq('property_id', property_id).eq('user_id', user_id).eq('status', 'pending').single();
    if (existing) return res.status(400).json({ message: 'Access request already pending' });

    const { data, error } = await supabase.from('document_access').insert({ property_id, user_id, status: 'pending' }).select('id').single();
    if (error) throw error;
    res.json({ id: data.id, message: 'Access request submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get access requests for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('document_access').select('*, users(name, email)').eq('property_id', req.params.propertyId).order('requested_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, user_name: r.users?.name, user_email: r.users?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's access requests
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('document_access').select('*, properties(title, location)').eq('user_id', req.params.userId).order('requested_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, property_location: r.properties?.location })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject access request
router.put('/:id/respond', async (req, res) => {
  try {
    const { status, response_message } = req.body;
    const { error } = await supabase.from('document_access').update({ status, response_message: response_message || null, responded_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: `Access request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
