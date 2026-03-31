const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Create payment confirmation
router.post('/', async (req, res) => {
  try {
    const { agreement_request_id, amount, payment_method, payment_reference, receipt_document, confirmed_by } = req.body;

    if (!agreement_request_id || !amount || !payment_method || !payment_reference) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const { data: request } = await supabase.from('agreement_requests').select('*').eq('id', agreement_request_id).single();
    if (!request) return res.status(404).json({ success: false, message: 'Agreement request not found' });

    const { data: newConf, error } = await supabase.from('payment_confirmations')
      .insert({ agreement_request_id, amount, payment_method, payment_reference, receipt_document, confirmed_by, status: 'confirmed' })
      .select('id').single();
    if (error) throw error;

    await supabase.from('agreement_requests').update({ payment_confirmed: true, payment_receipt_id: newConf.id }).eq('id', agreement_request_id);

    const recipientId = request.broker_id || request.owner_id;
    if (recipientId) {
      await supabase.from('notifications').insert({ user_id: recipientId, title: 'Payment Confirmed', message: `Payment of ${amount} has been confirmed for property agreement`, type: 'success' });
    }

    res.status(201).json({ success: true, id: newConf.id, message: 'Payment confirmed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm payment', error: error.message });
  }
});

// Get payment confirmation by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('payment_confirmations').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Payment confirmation not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment confirmations for agreement request
router.get('/agreement/:agreementRequestId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('payment_confirmations').select('*').eq('agreement_request_id', req.params.agreementRequestId).order('confirmed_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get payment confirmations for user
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { data: requests } = await supabase.from('agreement_requests').select('id').or(`customer_id.eq.${userId},broker_id.eq.${userId},owner_id.eq.${userId}`);
    const requestIds = (requests || []).map(r => r.id);
    if (!requestIds.length) return res.json([]);

    const { data, error } = await supabase.from('payment_confirmations').select('*, agreement_requests(property_id, customer_id, broker_id, owner_id)').in('agreement_request_id', requestIds).order('confirmed_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment confirmation status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const { error } = await supabase.from('payment_confirmations').update({ status }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Payment confirmation updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete payment confirmation
router.delete('/:id', async (req, res) => {
  try {
    const { data: conf } = await supabase.from('payment_confirmations').select('agreement_request_id').eq('id', req.params.id).single();
    if (!conf) return res.status(404).json({ message: 'Payment confirmation not found' });

    await supabase.from('payment_confirmations').delete().eq('id', req.params.id);
    await supabase.from('agreement_requests').update({ payment_confirmed: false, payment_receipt_id: null }).eq('id', conf.agreement_request_id);

    res.json({ message: 'Payment confirmation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
