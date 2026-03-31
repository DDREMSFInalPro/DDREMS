const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get commissions for a broker
router.get('/broker/:brokerId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commission_tracking')
      .select('*, properties(title, price)')
      .eq('broker_id', req.params.brokerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json((data || []).map(c => ({ ...c, property_title: c.properties?.title, price: c.properties?.price })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get commission summary for a broker
router.get('/broker/:brokerId/summary', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('commission_tracking')
      .select('commission_amount, status')
      .eq('broker_id', req.params.brokerId);
    if (error) throw error;

    const summary = (data || []).reduce((acc, c) => {
      acc.total_commissions++;
      acc.total_amount += c.commission_amount || 0;
      if (c.status === 'paid') acc.total_paid += c.commission_amount || 0;
      if (c.status === 'pending') acc.total_pending += c.commission_amount || 0;
      return acc;
    }, { total_commissions: 0, total_paid: 0, total_pending: 0, total_amount: 0 });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create commission record
router.post('/', async (req, res) => {
  try {
    const { broker_id, property_id, transaction_id, commission_amount, commission_rate } = req.body;
    const { data, error } = await supabase
      .from('commission_tracking')
      .insert({ broker_id, property_id, transaction_id, commission_amount, commission_rate })
      .select('id').single();
    if (error) throw error;
    res.json({ id: data.id, message: 'Commission recorded' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update commission status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, payment_date } = req.body;
    const { error } = await supabase
      .from('commission_tracking')
      .update({ status, payment_date })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Commission status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
