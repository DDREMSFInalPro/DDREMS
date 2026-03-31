const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const crypto = require('crypto');

// Create a new key request
router.post('/', async (req, res) => {
  try {
    const { property_id, customer_id, request_message } = req.body;

    const { data: property } = await supabase.from('properties').select('owner_id, title').eq('id', property_id).single();
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const { data: existing } = await supabase.from('request_key').select('id').eq('property_id', property_id).eq('customer_id', customer_id).eq('status', 'pending').single();
    if (existing) return res.status(400).json({ message: 'You already have a pending key request for this property.' });

    const { data: newReq, error } = await supabase.from('request_key')
      .insert({ property_id, customer_id, owner_id: property.owner_id, request_message })
      .select('id').single();
    if (error) throw error;

    const { data: admins } = await supabase.from('users').select('id').eq('role', 'property_admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.id, title: 'New Key Request', message: `A new key request for ${property.title}`, type: 'info' })));
    }

    res.status(201).json({ id: newReq.id, message: 'Key request submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer's key requests
router.get('/customer/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('request_key')
      .select('*, properties(title, location)')
      .eq('customer_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, property_location: r.properties?.location, request_type: 'key' })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending key requests for admin
router.get('/admin/pending', async (req, res) => {
  try {
    const propertyAdminId = req.query.admin_id || req.headers['x-admin-id'];
    let query = supabase.from('request_key')
      .select('*, properties(title, property_admin_id), users!customer_id(name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let results = (data || []).map(r => ({ ...r, property_title: r.properties?.title, customer_name: r.users?.name, customer_email: r.users?.email, request_type: 'key' }));
    if (propertyAdminId) results = results.filter(r => String(r.properties?.property_admin_id) === String(propertyAdminId));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Preview key before sending
router.get('/:id/preview-key', async (req, res) => {
  try {
    const { data: req_ } = await supabase.from('request_key').select('property_id').eq('id', req.params.id).single();
    if (!req_) return res.status(404).json({ message: 'Request not found' });

    const { data: doc } = await supabase.from('property_documents').select('access_key').eq('property_id', req_.property_id).limit(1).single();
    const key_code = doc?.access_key || crypto.randomBytes(4).toString('hex').toUpperCase();
    res.json({ key_code, is_new: !doc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to key request
router.put('/:id/respond-key', async (req, res) => {
  try {
    const { status, response_message, admin_id, key_code: provided_key } = req.body;
    const { data: request } = await supabase.from('request_key').select('property_id, customer_id').eq('id', req.params.id).single();
    if (!request) return res.status(404).json({ message: 'Request not found' });

    let final_key = provided_key;
    if (status === 'accepted' && !final_key) {
      const { data: doc } = await supabase.from('property_documents').select('access_key').eq('property_id', request.property_id).limit(1).single();
      final_key = doc?.access_key || crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    await supabase.from('request_key').update({ status, key_code: final_key, response_message, admin_id, responded_at: new Date().toISOString() }).eq('id', req.params.id);

    await supabase.from('notifications').insert({
      user_id: request.customer_id,
      title: `Key Request ${status === 'accepted' ? 'Approved' : 'Rejected'}`,
      message: status === 'accepted' ? `Your key is: ${final_key}` : response_message,
      type: status === 'accepted' ? 'success' : 'error',
    });

    res.json({ message: 'Key request processed', key_code: final_key });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get key request history for admin
router.get('/admin/history', async (req, res) => {
  try {
    const propertyAdminId = req.query.admin_id || req.headers['x-admin-id'];
    const { data, error } = await supabase.from('request_key')
      .select('*, properties(title, property_admin_id), users!customer_id(name)')
      .in('status', ['accepted', 'rejected', 'cancelled'])
      .order('responded_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    let results = (data || []).map(r => ({ ...r, property_title: r.properties?.title, customer_name: r.users?.name, request_type: 'key' }));
    if (propertyAdminId) results = results.filter(r => String(r.properties?.property_admin_id) === String(propertyAdminId));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get broker's key requests
router.get('/broker/:brokerId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('request_key')
      .select('*, properties!inner(title, broker_id), users!customer_id(name)')
      .eq('properties.broker_id', req.params.brokerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, customer_name: r.users?.name, request_type: 'key' })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
