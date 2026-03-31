const express = require('express');
const router = express.Router();
const supabase = require('../config/db');
const crypto = require('crypto');

// Create agreement request
router.post('/', async (req, res) => {
  try {
    const { property_id, customer_id, request_message } = req.body;

    const { data: property } = await supabase.from('properties').select('owner_id, title').eq('id', property_id).single();
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const { data: existing } = await supabase.from('agreement_requests').select('id').eq('property_id', property_id).eq('customer_id', customer_id).eq('status', 'pending').single();
    if (existing) return res.status(400).json({ message: 'You already have a pending agreement request for this property.' });

    const { data: newReq, error } = await supabase.from('agreement_requests')
      .insert({ property_id, customer_id, owner_id: property.owner_id, customer_notes: request_message })
      .select('id').single();
    if (error) throw error;

    res.status(201).json({ id: newReq.id, message: 'Agreement request submitted!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get customer's requests
router.get('/customer/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties(title, location)')
      .eq('customer_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, property_location: r.properties?.location, request_type: 'agreement' })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending requests for admin
router.get('/admin/pending', async (req, res) => {
  try {
    const propertyAdminId = req.query.admin_id || req.headers['x-admin-id'];
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties(title, property_admin_id), users!customer_id(name, email)')
      .eq('status', 'pending_admin_review')
      .is('forwarded_to_owner_date', null)
      .order('created_at', { ascending: false });
    if (error) throw error;

    let results = (data || []).map(r => ({ ...r, property_title: r.properties?.title, customer_name: r.users?.name, customer_email: r.users?.email, request_type: 'agreement' }));
    if (propertyAdminId) results = results.filter(r => String(r.properties?.property_admin_id) === String(propertyAdminId));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Preview key
router.get('/:id/preview-key', async (req, res) => {
  try {
    const { data: req_ } = await supabase.from('agreement_requests').select('property_id').eq('id', req.params.id).single();
    if (!req_) return res.status(404).json({ message: 'Request not found' });
    const { data: doc } = await supabase.from('property_documents').select('access_key').eq('property_id', req_.property_id).limit(1).single();
    const key_code = doc?.access_key || crypto.randomBytes(4).toString('hex').toUpperCase();
    res.json({ key_code, is_new: !doc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get admin history
router.get('/admin/history', async (req, res) => {
  try {
    const propertyAdminId = req.query.admin_id || req.headers['x-admin-id'];
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties(title, property_admin_id), users!customer_id(name)')
      .in('status', ['owner_accepted', 'owner_rejected', 'completed', 'suspended'])
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    let results = (data || []).map(r => ({ ...r, property_title: r.properties?.title, customer_name: r.users?.name, request_type: 'agreement' }));
    if (propertyAdminId) results = results.filter(r => String(r.properties?.property_admin_id) === String(propertyAdminId));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin respond
router.put('/:id/respond-admin', async (req, res) => {
  try {
    const { status, response_message, admin_id } = req.body;
    const { error } = await supabase.from('agreement_requests').update({ status, response_message, admin_id, responded_at: new Date().toISOString() }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Agreement response successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forward to owner
router.put('/:id/forward', async (req, res) => {
  try {
    const { admin_id, response_message } = req.body;
    const { data: request } = await supabase.from('agreement_requests').select('*, properties(title)').eq('id', req.params.id).single();
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ admin_action: admin_id, admin_action_date: now, admin_notes: response_message || 'Forwarded for owner approval', forwarded_to_owner_date: now, updated_at: now }).eq('id', req.params.id);

    if (request.owner_id) {
      await supabase.from('notifications').insert({ user_id: request.owner_id, title: 'Forwarded Agreement', message: `A new agreement request for ${request.properties?.title} needs your review.`, type: 'info', related_id: req.params.id });
    }
    res.json({ message: 'Agreement forwarded to owner' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get owner's forwarded requests
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties(title), users!customer_id(name)')
      .eq('owner_id', req.params.ownerId)
      .eq('status', 'pending_admin_review')
      .not('forwarded_to_owner_date', 'is', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, customer_name: r.users?.name, request_type: 'agreement' })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get broker's requests
router.get('/broker/:brokerId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('agreement_requests')
      .select('*, properties!inner(title, broker_id), users!customer_id(name)')
      .eq('properties.broker_id', req.params.brokerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(r => ({ ...r, property_title: r.properties?.title, customer_name: r.users?.name, request_type: 'agreement' })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Owner/Broker respond
router.put('/:id/respond', async (req, res) => {
  try {
    const { status, response_message, responded_by } = req.body;
    const { data: request } = await supabase.from('agreement_requests').select('*').eq('id', req.params.id).single();
    if (!request) return res.status(404).json({ message: 'Agreement request not found' });

    const now = new Date().toISOString();
    await supabase.from('agreement_requests').update({ status, response_message, responded_by: responded_by || null, updated_at: now, responded_at: now }).eq('id', req.params.id);

    if (status === 'accepted') {
      const { data: existing } = await supabase.from('agreements').select('id').eq('property_id', request.property_id).eq('owner_id', request.owner_id).in('status', ['pending', 'active']).limit(1).single();

      let agreementId;
      if (!existing) {
        const { data: newAgr } = await supabase.from('agreements')
          .insert({ property_id: request.property_id, owner_id: request.owner_id, customer_id: request.customer_id, broker_id: request.broker_id || responded_by || null, agreement_text: response_message || 'Agreement accepted', status: 'pending' })
          .select('id').single();
        agreementId = newAgr?.id;
      } else {
        agreementId = existing.id;
      }

      if (request.customer_id) {
        await supabase.from('notifications').insert({ user_id: request.customer_id, title: 'Agreement Request Accepted!', message: response_message ? `Your agreement request has been accepted! ${response_message}` : 'Your agreement request has been accepted! The agreement document is now available.', type: 'success', related_id: agreementId });
      }

      const notifyTo = [request.owner_id, request.broker_id].filter((id, i, arr) => id && arr.indexOf(id) === i && id !== request.customer_id);
      if (notifyTo.length) {
        await supabase.from('notifications').insert(notifyTo.map(id => ({ user_id: id, title: 'Agreement Created', message: `Agreement #${agreementId} has been created and sent to the customer.`, type: 'info', related_id: agreementId })));
      }
    } else if (request.customer_id) {
      await supabase.from('notifications').insert({ user_id: request.customer_id, title: 'Agreement Request Rejected', message: response_message || 'Your agreement request has been rejected.', type: 'error' });
    }

    res.json({ message: `Request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
