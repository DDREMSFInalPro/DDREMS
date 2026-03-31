const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get verification status for a property
router.get('/property/:propertyId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('property_verification').select('*, users(name)').eq('property_id', req.params.propertyId).order('created_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data ? { ...data, verified_by_name: data.users?.name } : null);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending verifications
router.get('/pending', async (req, res) => {
  try {
    const { data, error } = await supabase.from('property_verification')
      .select('*, properties(title, location, owner:users!owner_id(name))')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(v => ({ ...v, property_title: v.properties?.title, location: v.properties?.location, owner_name: v.properties?.owner?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create verification record
router.post('/', async (req, res) => {
  try {
    const { property_id } = req.body;
    const { data, error } = await supabase.from('property_verification').insert({ property_id }).select('id').single();
    if (error) throw error;
    res.json({ id: data.id, message: 'Verification record created' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update verification status
router.put('/:id', async (req, res) => {
  try {
    const { verification_status, verification_notes, verified_by } = req.body;
    const { error } = await supabase.from('property_verification').update({ verification_status, verification_notes, verified_by, verified_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) throw error;

    const { data: verification } = await supabase.from('property_verification').select('property_id').eq('id', req.params.id).single();
    if (verification) {
      let propertyStatus = 'active';
      if (verification_status === 'rejected') propertyStatus = 'inactive';
      if (verification_status === 'suspended') propertyStatus = 'suspended';
      await supabase.from('properties').update({ status: propertyStatus }).eq('id', verification.property_id);
    }

    res.json({ message: `Property ${verification_status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
