const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get broker's property requests
router.get('/broker/:brokerId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('property_requests')
      .select('*, properties(title, location, price, main_image), owner:users!owner_id(name)')
      .eq('broker_id', req.params.brokerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, property_location: r.properties?.location, property_price: r.properties?.price, property_image: r.properties?.main_image, owner_name: r.owner?.name })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get owner's property requests
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('property_requests')
      .select('*, properties(title, location, price), broker:users!broker_id(name, email)')
      .eq('owner_id', req.params.ownerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, property_location: r.properties?.location, property_price: r.properties?.price, broker_name: r.broker?.name, broker_email: r.broker?.email })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create property request
router.post('/', async (req, res) => {
  try {
    const { property_id, broker_id, request_type, request_message } = req.body;

    const { data: property } = await supabase.from('properties').select('owner_id').eq('id', property_id).single();
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const { data: existing } = await supabase.from('agreement_requests').select('id').eq('property_id', property_id).eq('customer_id', broker_id).eq('status', 'pending').single();
    if (existing) return res.status(400).json({ message: 'You already have a pending request for this property' });

    const { data: newReq, error } = await supabase.from('property_requests')
      .insert({ property_id, broker_id, owner_id: property.owner_id, request_type, request_message, status: 'pending' })
      .select('id').single();
    if (error) throw error;

    if (property.owner_id) {
      await supabase.from('notifications').insert({ user_id: property.owner_id, title: 'New Property Request', message: 'A broker has sent you a property request', type: 'info', related_id: newReq.id });
    }

    res.status(201).json({ message: 'Property request sent successfully', requestId: newReq.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Respond to property request
router.put('/:id/respond', async (req, res) => {
  try {
    const { status, response_message } = req.body;
    if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const { data: request } = await supabase.from('property_requests').select('*').eq('id', req.params.id).single();
    if (!request) return res.status(404).json({ message: 'Request not found' });

    await supabase.from('property_requests').update({ status, response_message, responded_at: new Date().toISOString() }).eq('id', req.params.id);

    await supabase.from('notifications').insert({
      user_id: request.broker_id,
      title: `Property Request ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
      message: response_message || `Your property request has been ${status}`,
      type: status === 'accepted' ? 'success' : 'error',
    });

    res.json({ message: `Request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
